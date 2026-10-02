# A3-08 Wallet bundle review

Next.js build's First Load JS for `/`: A3-07 approximately **1.03 MB**; A3-08 normal Release 1 build **760 kB** (about **26% smaller**, rounded build figures). Locked Preview build reports **759 kB**. This is build-estimated first load, not a promise about measured network transfer or authenticated interaction cost.

Changes: split LoginView from Privy-hook LoginScreen, split authenticated Dashboard behind a dynamic boundary, load TronWorkspace when selected, and remove Buy/Swap entry-point wiring from the real dashboards while retaining their isolated components/tests. Their source is preserved, not deleted. Existing swap-mounted lifecycle remains intact in isolated development panels. Privy App ID lookup and embedded-wallet creation policy are unchanged.

Privy React / its wallet-connector graph dominate the remaining client cost; viem and TronWeb/Tron paths contribute deferred work. Largest raw emitted Wallet chunks are approximately 1,026,269, 921,100 and 834,706 bytes; these are uncompressed asynchronous assets and must not be added to the first-load figure. Admin's largest raw chunk remains 1,894,719 bytes. Removing an import from a dashboard does not prove the SDK dependency graph is eliminated: the build still includes deferred development-route assets, with those routes denied in hosted/production runtime.

No SDK major upgrade, signer migration, custom tree-shaking override or package replacement was undertaken. Further gains require measured SDK/provider splitting and continuity regression, not a bundle-size target at the expense of wallet safety.

Evidence: wallet-build.log (locked Preview), wallet-build-release1.log (local normal build), cnh-wallet-largest-chunks.json, admin-build.log, wallet-hosted-final.json. No production deployment occurred.
