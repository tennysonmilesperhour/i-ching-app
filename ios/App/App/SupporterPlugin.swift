import Foundation
import Capacitor
import StoreKit
import UIKit

private enum SupporterStoreError: LocalizedError {
    case productUnavailable
    case failedVerification
    case entitlementRequired
    case alternateIconsUnavailable

    var errorDescription: String? {
        switch self {
        case .productUnavailable:
            return "The Supporter Upgrade is not available right now."
        case .failedVerification:
            return "Apple could not verify this purchase."
        case .entitlementRequired:
            return "The Supporter Upgrade is required for the gilded icon."
        case .alternateIconsUnavailable:
            return "Alternate app icons are not available on this device."
        }
    }
}

@objc(SupporterPlugin)
public class SupporterPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SupporterPlugin"
    public let jsName = "Supporter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setIcon", returnType: CAPPluginReturnPromise)
    ]

    private let productID = "com.thefreeiching.app.supporter"
    private let supporterIconName = "SupporterIcon"

    @objc func getStatus(_ call: CAPPluginCall) {
        Task {
            do {
                let product = try await Product.products(for: [productID]).first
                let entitled = await hasSupporterEntitlement()
                let activeIcon = await MainActor.run {
                    UIApplication.shared.alternateIconName == self.supporterIconName ? "gilded" : "standard"
                }

                resolve(call, data: statusData(product: product, entitled: entitled, activeIcon: activeIcon))
            } catch {
                reject(call, error: error)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        Task {
            do {
                guard let product = try await Product.products(for: [productID]).first else {
                    throw SupporterStoreError.productUnavailable
                }

                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else {
                        throw SupporterStoreError.failedVerification
                    }
                    guard transaction.productID == productID else {
                        throw SupporterStoreError.failedVerification
                    }
                    await transaction.finish()
                    resolve(call, data: ["status": "purchased", "entitled": true])
                case .pending:
                    resolve(call, data: ["status": "pending", "entitled": false])
                case .userCancelled:
                    resolve(call, data: ["status": "cancelled", "entitled": false])
                @unknown default:
                    resolve(call, data: ["status": "pending", "entitled": false])
                }
            } catch {
                reject(call, error: error)
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                let entitled = await hasSupporterEntitlement()
                resolve(call, data: ["entitled": entitled])
            } catch {
                reject(call, error: error)
            }
        }
    }

    @objc func setIcon(_ call: CAPPluginCall) {
        let gilded = call.getBool("gilded") ?? false

        Task {
            do {
                let entitled = await hasSupporterEntitlement()
                if gilded && !entitled {
                    throw SupporterStoreError.entitlementRequired
                }

                try await setAlternateIcon(gilded ? supporterIconName : nil)
                resolve(call, data: ["activeIcon": gilded ? "gilded" : "standard"])
            } catch {
                reject(call, error: error)
            }
        }
    }

    private func hasSupporterEntitlement() async -> Bool {
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { continue }
            if transaction.productID == productID && transaction.revocationDate == nil {
                return true
            }
        }
        return false
    }

    private func statusData(product: Product?, entitled: Bool, activeIcon: String) -> JSObject {
        var data: JSObject = [
            "available": product != nil,
            "entitled": entitled,
            "productId": productID,
            "activeIcon": activeIcon
        ]

        if let product {
            data["displayName"] = product.displayName
            data["displayPrice"] = product.displayPrice
            data["description"] = product.description
        }
        return data
    }

    private func setAlternateIcon(_ name: String?) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            DispatchQueue.main.async {
                guard UIApplication.shared.supportsAlternateIcons else {
                    continuation.resume(throwing: SupporterStoreError.alternateIconsUnavailable)
                    return
                }

                UIApplication.shared.setAlternateIconName(name) { error in
                    if let error {
                        continuation.resume(throwing: error)
                    } else {
                        continuation.resume()
                    }
                }
            }
        }
    }

    private func resolve(_ call: CAPPluginCall, data: JSObject) {
        DispatchQueue.main.async { call.resolve(data) }
    }

    private func reject(_ call: CAPPluginCall, error: Error) {
        DispatchQueue.main.async {
            call.reject(error.localizedDescription, "SUPPORTER_STORE_ERROR", error)
        }
    }
}
