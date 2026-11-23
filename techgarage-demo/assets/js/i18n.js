/* TechGarage demo — languages.
   English, French and Arabic. Arabic switches the whole layout to right-to-left.
   t(key, vars) for phrases, plural(key, n) for counts (CLDR plural rules,
   so Arabic gets its zero/one/two/few/many forms), and helpers for prices,
   dates, tags and product copy. */

export const LANGS = [
  { id: 'en', label: 'English',  short: 'EN', dir: 'ltr', locale: 'en-GB' },
  { id: 'fr', label: 'Français', short: 'FR', dir: 'ltr', locale: 'fr-FR' },
  { id: 'ar', label: 'العربية',  short: 'ع',  dir: 'rtl', locale: 'ar-TN' }
];

/* ══════════════════════════════════════════════════════════════════════
   Phrases
   ══════════════════════════════════════════════════════════════════════ */
const STR = {
  en: {
    'brand': 'TechGarage',
    'cat.all': 'Trending', 'cat.games': 'PC Games', 'cat.cards': 'Gift Cards', 'cat.mobile': 'Mobile', 'cat.software': 'Software',
    'cat.allProducts': 'All products',
    'sub.accounts': 'Fresh accounts', 'sub.keys': 'Game keys', 'sub.topups': 'Game top-ups', 'sub.ps': 'PlayStation games',
    'sub.licenses': 'Software licences', 'sub.apps': 'App credits',
    'sub.all': 'All',

    'search.ph': 'Search the store', 'search.label': 'Search products', 'search.results': 'Search results',
    'search.empty': 'Nothing matches “{q}”.', 'search.seeAll': 'See all results ({n})',
    'rail.sections': 'Sections', 'rail.store': 'Store', 'rail.wishlist': 'Wishlist', 'rail.basket': 'Basket', 'rail.profile': 'Profile', 'rail.settings': 'Settings',
    'bell': 'Notifications', 'notif.viewAll': 'View all notifications',
    'menu.profile': 'Profile', 'menu.orders': 'Orders', 'menu.wishlist': 'Wishlist', 'menu.settings': 'Settings', 'menu.support': 'Support', 'menu.signout': 'Sign out',
    'toast.signout': 'Signing out isn’t part of this demo',
    'basket.title': 'Your basket', 'basket.close': 'Close basket', 'basket.empty': 'Your basket is empty.', 'basket.total': 'Total', 'basket.checkout': 'Checkout',
    'basket.fewer': 'One fewer', 'basket.more': 'One more',
    'lang.label': 'Language', 'lang.changed': 'Language: English',
    'tabs.label': 'Categories', 'crumbs': 'Breadcrumb',

    'toast.added': '{name} added to basket', 'toast.saved': 'Saved to wishlist', 'toast.removed': 'Removed from wishlist',
    'toast.copied': 'Copied to clipboard', 'toast.done': 'Saved', 'toast.accent': 'Accent colour updated', 'toast.profile': 'Profile saved',
    'toast.password': 'Password updated', 'toast.history': 'History cleared', 'toast.export': 'Your data is downloading',
    'toast.addedAll': 'Wishlist added to basket', 'toast.delivered': 'Order {id} delivered', 'toast.mail': 'Opening your email app…',

    'home.title': 'Gaming store', 'home.newDrops': 'New Drops', 'home.sortBy': 'Sort by:', 'sort.new': 'Newest', 'sort.low': 'Price ↑', 'sort.high': 'Price ↓', 'sort.az': 'A – Z',
    'home.recent': 'Recently Viewed', 'home.viewedRecently': 'Viewed recently', 'home.inBasket': 'In your basket', 'home.deliveredOn': 'Delivered · {date}', 'home.viewedYesterday': 'Viewed yesterday',
    'home.youMightLike': 'You might like', 'home.seeAll': 'See all', 'home.trending': 'Now Trending', 'home.featured': 'Featured products',
    'buy.now': 'Buy now', 'buy.add': 'Add to basket', 'buy.addNamed': 'Add {name} to basket', 'buy.more': 'More about {name}',
    'note.instant': 'Instant delivery', 'note.minutes': 'Credited in minutes', 'slide': 'Slide {n}', 'prev': 'Previous', 'next': 'Next',
    'heart.save': 'Save {name}', 'heart.remove': 'Remove {name}',

    'shop.title': 'Shop', 'shop.results': 'Results for “{q}”', 'shop.category': 'Category', 'shop.price': 'Price', 'shop.sort': 'Sort',
    'shop.filters': 'Filters', 'shop.clear': 'Clear filters', 'shop.none': 'Nothing matches', 'shop.noneQ': 'No products match “{q}” with these filters.',
    'shop.nonePrice': 'No products in this price range.', 'shop.browse': 'Browse the store', 'shop.allIn': 'All {cat}',
    'price.any': 'Any price', 'price.0-50': 'Under 50 DT', 'price.50-100': '50 – 100 DT', 'price.100-200': '100 – 200 DT', 'price.200-': '200 DT and up',
    'ssort.featured': 'Featured', 'ssort.low': 'Price: low to high', 'ssort.high': 'Price: high to low', 'ssort.az': 'Name: A – Z',
    'home': 'Home',

    'pdp.tax': 'Tax incl.', 'pdp.qty': 'Quantity', 'pdp.source': 'View on techgarage.tn', 'pdp.how': 'How it works', 'pdp.details': 'Details',
    'pdp.related': 'You may also like', 'pdp.moreIn': 'More in {cat}', 'pdp.notFound': 'Product not found',
    'spec.product': 'Product', 'spec.category': 'Category', 'spec.platform': 'Platform', 'spec.type': 'Type', 'spec.includes': 'Includes',
    'spec.delivery': 'Delivery', 'spec.price': 'Price', 'spec.priceTax': '{price} · tax included',
    'dlv.account': 'Fresh account, delivered by email', 'dlv.key': 'Activation key, delivered by email',
    'dlv.code': 'Gift card code, delivered by email', 'dlv.topup': 'Credited to your player ID',
    'how.pay': 'Pay securely', 'how.payD': 'Check out in a minute — no account needed.', 'how.payShort': 'Check out in a minute.',
    'how.loginT': 'Get the login by email', 'how.keyT': 'Get your key by email', 'how.codeT': 'Get the code by email', 'how.emailD': 'Usually within minutes of payment.',
    'how.ownT': 'Make it yours', 'how.ownD': 'Sign in and change the password. Keep the linked email for at least a month.',
    'how.idT': 'Enter your player ID', 'how.idD': 'Asked for at checkout — double-check it.',
    'how.creditT': 'Credits arrive in-game', 'how.creditD': 'Added to your account within minutes.',
    'how.redeemT': 'Redeem on {platform}', 'how.redeemD': 'The balance lands in your wallet straight away.',
    'how.activateT': 'Activate on {platform}', 'how.activateD': 'Redeem the key and start the download.',

    'wish.title': 'Wishlist', 'wish.total': '{price} in total', 'wish.addAll': 'Add all to basket',
    'wish.empty': 'Nothing saved yet', 'wish.emptyD': 'Tap the heart on any product to keep it here for later.',

    'co.title': 'Checkout', 'co.digital': 'digital delivery', 'co.demo': 'Demo checkout — no payment is taken and nothing is charged.',
    'co.contact': 'Contact', 'co.contactD': 'Your codes and logins are sent to this email.', 'co.name': 'Full name', 'co.email': 'Email', 'co.phone': 'Phone',
    'co.player': 'Player ID', 'co.playerD': 'Your basket has a top-up — it’s credited to this in-game ID.', 'co.playerPh': 'e.g. 51 873 2290',
    'co.payment': 'Payment', 'co.paymentLabel': 'Payment method', 'co.terms': 'I accept the terms of sale and understand digital goods are delivered by email.',
    'co.place': 'Place order · {total}', 'co.summary': 'Order summary', 'co.each': '{price} each', 'co.subtotal': 'Subtotal', 'co.delivery': 'Delivery',
    'co.free': 'Free · by email', 'co.total': 'Total', 'co.qtyOf': 'Quantity of {name}',
    'co.emptyT': 'Your basket is empty', 'co.emptyD': 'Add something first — the checkout will be waiting.',
    'err.name': 'Enter your full name.', 'err.email': 'Enter a valid email address.', 'err.phone': 'Enter a phone number with at least 8 digits.',
    'err.player': 'Enter the numeric player ID from your game profile.', 'err.terms': 'Please accept the terms to continue.',
    'pay.card': 'Bank card', 'pay.cardD': 'Visa, Mastercard or a Tunisian e-Dinar card', 'pay.d17': 'D17', 'pay.d17D': 'Pay from the D17 app',
    'pay.transfer': 'Bank transfer', 'pay.transferD': 'Delivered once the transfer arrives',
    'co.fee.clictopay': 'Bank fees', 'co.fee.d17': 'D17 fee', 'co.fee.transfer': 'Transfer fee', 'pay.clictopay': 'Bank card · ClicToPay', 'pay.clictopayD': 'Visa, Mastercard, CIB or e-Dinar — on the secure ClicToPay page',
    'co.redirect': 'Opening the secure ClicToPay page…', 'co.redirectD': 'Demo — no card is charged.',
    'co.fromAccount': 'Filled in from your account', 'co.edit': 'Edit', 'co.done': 'Done', 'co.saveToAccount': 'Save these details to my account',
    'co.games': 'Game accounts', 'co.gamesD': 'Each game is topped up its own way — one block per game.', 'co.remembered': 'Filled in from your last order',
    'acc.loginD': 'We sign in to your game account, buy the top-up, then sign out.', 'acc.idD': 'Credited straight to this in-game ID.',
    'acc.email': 'Game account email', 'acc.password': 'Game account password', 'acc.uid': 'UID', 'acc.uidPh': 'e.g. 512 873 229',
    'acc.platform': 'Phone', 'acc.android': 'Android', 'acc.ios': 'iOS', 'acc.show': 'Show password', 'acc.hide': 'Hide password',
    'acc.never': 'Used once for this top-up, never saved.',
    'err.gemail': 'Enter the email of your game account.', 'err.gpass': 'Enter the password of your game account.',
    'err.uid': 'Enter the numeric UID from your game profile.', 'err.platform': 'Choose Android or iOS.',
    'cred.loginCredited': 'Credited to the account {email}', 'dlv.login': 'We sign in to your game account and add it for you',
    'how.gameLoginT': 'Give your game login', 'how.gameLoginD': 'Email and password at checkout.', 'how.gameLoginFullD': 'Email, password, UID and Android or iOS at checkout.',
    'pdp.region': 'Region', 'pdp.value': 'Card value', 'pdp.amount': 'Amount', 'pdp.otherBrands': 'Other brands',
    'region.GL': 'Global', 'region.FR': 'France', 'region.US': 'United States', 'region.TR': 'Turkey', 'region.IN': 'India', 'region.EU': 'Europe',
    'fam.from': 'From {price}', 'fam.open': 'See {name} options',

    'ord.thanks': 'Thank you, {name}!', 'ord.thanksAnon': 'Thank you!',
    'ord.doneD': 'Order {id} is confirmed. Everything has been delivered below and to {email}.',
    'ord.pendD': 'Order {id} is confirmed. Your codes will appear here and be emailed to {email}.',
    'ord.title': 'Order {id}', 'ord.progress': 'Order progress', 'ord.placed': 'Placed', 'ord.paid': 'Paid', 'ord.delivered': 'Delivered', 'ord.delivering': 'Delivering…',
    'ord.byEmail': 'By email', 'ord.minutes': 'Usually within minutes', 'ord.items': 'Items', 'ord.preparing': 'Preparing your delivery…',
    'ord.summary': 'Summary', 'ord.payment': 'Payment', 'ord.to': 'Delivered to', 'ord.player': 'Player ID', 'ord.help': 'Need help with this order?',
    'ord.fine': 'All codes and logins shown in this demo start with DEMO and are not real.',
    'st.delivered': 'Delivered', 'st.processing': 'Processing',
    'cred.account': 'Account login', 'cred.code': 'Gift card code', 'cred.key': 'Activation key', 'cred.topup': 'Top-up', 'cred.credited': 'Credited to player ID {id}',
    'cred.reveal': 'Reveal', 'cred.hide': 'Hide', 'cred.copy': 'Copy',
    'orders.title': 'Orders', 'orders.total': '{price} in total',

    'pf.title': 'Profile', 'pf.since': 'Member since {date}', 'pf.edit': 'Edit profile', 'pf.orders': 'Orders', 'pf.spent': 'Total spent',
    'pf.keys': 'Keys & accounts', 'pf.wish': 'Wishlist', 'pf.vault': 'My keys & accounts', 'pf.vaultD': 'Everything you’ve been delivered, in one place',
    'pf.noKeys': 'No keys yet', 'pf.noKeysD': 'Codes and logins you buy will appear here once delivered.', 'pf.recent': 'Recent orders', 'pf.all': 'All orders',

    'set.title': 'Settings', 'set.sub': 'Manage your account and how the store looks and behaves.', 'set.sections': 'Settings sections',
    'set.profile': 'Profile', 'set.security': 'Security', 'set.notifications': 'Notifications', 'set.appearance': 'Appearance', 'set.privacy': 'Privacy & data',
    'set.avatar': 'Avatar', 'set.details': 'Details', 'set.name': 'Display name', 'set.handle': 'Username', 'set.save': 'Save changes',
    'err.name2': 'Enter at least 2 characters.', 'err.handle': '3–20 letters, numbers, dots or underscores.', 'err.phone2': 'Enter at least 8 digits.',
    'set.changePw': 'Change password', 'set.current': 'Current password', 'set.new': 'New password', 'set.confirm': 'Confirm new password',
    'set.pwHint': 'At least 8 characters, with a letter and a number.', 'set.pwWeak': 'Weak — add length, numbers or symbols.', 'set.pwOk': 'Good.', 'set.pwStrong': 'Strong password.',
    'set.update': 'Update password', 'err.current': 'Enter your current password.', 'err.match': 'Passwords don’t match.',
    'set.protect': 'Sign-in protection', 'set.2fa': 'Two-step verification', 'set.2faD': 'Ask for a one-time code when you sign in on a new device.',
    'set.tellMe': 'Tell me about', 'set.nOrders': 'Order updates', 'set.nOrdersD': 'Payment confirmed, codes delivered, top-ups credited.',
    'set.nStock': 'Back in stock', 'set.nStockD': 'When something on your wishlist is available again.',
    'set.nPrice': 'Price drops', 'set.nPriceD': 'When a product on your wishlist gets cheaper.',
    'set.nNews': 'News and offers', 'set.nNewsD': 'New releases and occasional promotions.',
    'set.sendBy': 'Send them by', 'set.chEmail': 'Email', 'set.chSms': 'SMS', 'set.chBoth': 'Email & SMS', 'set.channel': 'Notification channel',
    'set.lang': 'Language', 'set.langD': 'Arabic switches the whole layout to right-to-left.',
    'set.accent': 'Accent colour', 'set.motion': 'Motion', 'set.bg': 'Animated background', 'set.bgD': 'The slow drifting light behind the store.',
    'set.rm': 'Reduce motion', 'set.rmD': 'Turn off carousel autoplay, parallax and transitions.',
    'acc.teal': 'TechGarage teal', 'acc.blue': 'Blue', 'acc.violet': 'Violet', 'acc.orange': 'Orange', 'acc.pink': 'Pink',
    'set.privHint': 'This demo keeps everything in your browser — nothing is sent to a server.',
    'set.export': 'Download my data', 'set.exportD': 'Your profile, preferences, basket, wishlist and orders as a JSON file.', 'set.exportB': 'Download',
    'set.clearV': 'Clear recently viewed', 'set.clearB': 'Clear',
    'set.reset': 'Reset everything', 'set.resetD': 'Empty the basket and wishlist, forget orders and restore default settings.', 'set.resetB': 'Reset', 'set.resetConfirm': 'Click again to confirm',

    'sup.title': 'How can we help?', 'sup.sub': 'Call, email or visit the shop in Mahdia — or find a quick answer below.',
    'sup.call': 'Call us', 'sup.email': 'Email', 'sup.visit': 'Visit the shop', 'sup.hours': 'Opening hours',
    'day.week': 'Monday – Friday', 'day.sat': 'Saturday', 'day.sun': 'Sunday',
    'sup.faq': 'Frequently asked', 'sup.send': 'Send us a message', 'sup.name': 'Name', 'sup.order': 'Order (optional)', 'sup.notOrder': 'Not about an order',
    'sup.msg': 'Message', 'sup.msgPh': 'How can we help?', 'sup.sendB': 'Send', 'sup.sendD': 'Opens your email app with the message ready to send to {email}.',
    'err.msg': 'Tell us a little more (at least 10 characters).', 'sup.subjOrder': 'Help with order {id}', 'sup.subjGeneral': 'Question from the website',
    'store.address': 'Rue Hssan Achoura, 5100 Mahdia, Tunisia',

    'nt.title': 'Notifications', 'nt.caught': 'You’re all caught up', 'nt.readAll': 'Mark all as read',
    'nt.hint': 'Choose what you’re told about in {link}.', 'nt.link': 'notification settings',
    'n4.t': 'Key delivered', 'n4.b': 'Your EA FC 27 account details are in your inbox.',
    'n3.t': 'Back in stock', 'n3.b': 'Steam Wallet 50 USD is available again — {price}.',
    'n2.t': 'Price drop', 'n2.b': 'Windows 10/11 Pro key is down to {price}.',
    'n1.t': 'Top-up done', 'n1.b': '5000 eFootball coins credited to your account.',
    'ago.m': '{n} min', 'ago.h': '{n} h', 'ago.d': '{n} d',

    'nf.title': 'This page doesn’t exist', 'nf.text': 'The link may be old, or the product is no longer sold.', 'nf.back': 'Back to the store', 'nf.browse': 'Browse all products',
    'demo.since': 'March 2025'
  },

  fr: {
    'brand': 'TechGarage',
    'cat.all': 'Tendances', 'cat.games': 'Jeux PC', 'cat.cards': 'Cartes cadeaux', 'cat.mobile': 'Mobile', 'cat.software': 'Logiciels',
    'cat.allProducts': 'Tous les produits',
    'sub.accounts': 'Comptes neufs', 'sub.keys': 'Clés de jeu', 'sub.topups': 'Recharges de jeux', 'sub.ps': 'Jeux PlayStation',
    'sub.licenses': 'Licences logicielles', 'sub.apps': 'Crédits d’applis',
    'sub.all': 'Tout',

    'search.ph': 'Rechercher dans la boutique', 'search.label': 'Rechercher des produits', 'search.results': 'Résultats de recherche',
    'search.empty': 'Aucun résultat pour « {q} ».', 'search.seeAll': 'Voir tous les résultats ({n})',
    'rail.sections': 'Sections', 'rail.store': 'Boutique', 'rail.wishlist': 'Favoris', 'rail.basket': 'Panier', 'rail.profile': 'Profil', 'rail.settings': 'Réglages',
    'bell': 'Notifications', 'notif.viewAll': 'Voir toutes les notifications',
    'menu.profile': 'Profil', 'menu.orders': 'Commandes', 'menu.wishlist': 'Favoris', 'menu.settings': 'Réglages', 'menu.support': 'Assistance', 'menu.signout': 'Se déconnecter',
    'toast.signout': 'La déconnexion ne fait pas partie de cette démo',
    'basket.title': 'Votre panier', 'basket.close': 'Fermer le panier', 'basket.empty': 'Votre panier est vide.', 'basket.total': 'Total', 'basket.checkout': 'Commander',
    'basket.fewer': 'Un de moins', 'basket.more': 'Un de plus',
    'lang.label': 'Langue', 'lang.changed': 'Langue : français',
    'tabs.label': 'Catégories', 'crumbs': 'Fil d’Ariane',

    'toast.added': '{name} ajouté au panier', 'toast.saved': 'Ajouté aux favoris', 'toast.removed': 'Retiré des favoris',
    'toast.copied': 'Copié dans le presse-papiers', 'toast.done': 'Enregistré', 'toast.accent': 'Couleur d’accent modifiée', 'toast.profile': 'Profil enregistré',
    'toast.password': 'Mot de passe modifié', 'toast.history': 'Historique effacé', 'toast.export': 'Téléchargement de vos données…',
    'toast.addedAll': 'Favoris ajoutés au panier', 'toast.delivered': 'Commande {id} livrée', 'toast.mail': 'Ouverture de votre messagerie…',

    'home.title': 'Boutique gaming', 'home.newDrops': 'Nouveautés', 'home.sortBy': 'Trier :', 'sort.new': 'Récents', 'sort.low': 'Prix ↑', 'sort.high': 'Prix ↓', 'sort.az': 'A – Z',
    'home.recent': 'Vus récemment', 'home.viewedRecently': 'Vu récemment', 'home.inBasket': 'Dans votre panier', 'home.deliveredOn': 'Livré · {date}', 'home.viewedYesterday': 'Vu hier',
    'home.youMightLike': 'Vous aimerez aussi', 'home.seeAll': 'Tout voir', 'home.trending': 'Tendance du moment', 'home.featured': 'Produits à la une',
    'buy.now': 'Acheter', 'buy.add': 'Ajouter au panier', 'buy.addNamed': 'Ajouter {name} au panier', 'buy.more': 'En savoir plus sur {name}',
    'note.instant': 'Livraison instantanée', 'note.minutes': 'Crédité en quelques minutes', 'slide': 'Diapositive {n}', 'prev': 'Précédent', 'next': 'Suivant',
    'heart.save': 'Ajouter {name} aux favoris', 'heart.remove': 'Retirer {name} des favoris',

    'shop.title': 'Boutique', 'shop.results': 'Résultats pour « {q} »', 'shop.category': 'Catégorie', 'shop.price': 'Prix', 'shop.sort': 'Trier',
    'shop.filters': 'Filtres', 'shop.clear': 'Effacer les filtres', 'shop.none': 'Aucun résultat', 'shop.noneQ': 'Aucun produit ne correspond à « {q} » avec ces filtres.',
    'shop.nonePrice': 'Aucun produit dans cette gamme de prix.', 'shop.browse': 'Parcourir la boutique', 'shop.allIn': 'Tout {cat}',
    'price.any': 'Tous les prix', 'price.0-50': 'Moins de 50 DT', 'price.50-100': '50 – 100 DT', 'price.100-200': '100 – 200 DT', 'price.200-': '200 DT et plus',
    'ssort.featured': 'En vedette', 'ssort.low': 'Prix croissant', 'ssort.high': 'Prix décroissant', 'ssort.az': 'Nom : A – Z',
    'home': 'Accueil',

    'pdp.tax': 'TTC', 'pdp.qty': 'Quantité', 'pdp.source': 'Voir sur techgarage.tn', 'pdp.how': 'Comment ça marche', 'pdp.details': 'Détails',
    'pdp.related': 'Vous aimerez aussi', 'pdp.moreIn': 'Plus dans {cat}', 'pdp.notFound': 'Produit introuvable',
    'spec.product': 'Produit', 'spec.category': 'Catégorie', 'spec.platform': 'Plateforme', 'spec.type': 'Type', 'spec.includes': 'Comprend',
    'spec.delivery': 'Livraison', 'spec.price': 'Prix', 'spec.priceTax': '{price} · TTC',
    'dlv.account': 'Compte neuf, livré par e-mail', 'dlv.key': 'Clé d’activation, livrée par e-mail',
    'dlv.code': 'Code de carte cadeau, livré par e-mail', 'dlv.topup': 'Crédité sur votre identifiant joueur',
    'how.pay': 'Payez en toute sécurité', 'how.payD': 'Commandez en une minute, sans créer de compte.', 'how.payShort': 'Commandez en une minute.',
    'how.loginT': 'Recevez les identifiants par e-mail', 'how.keyT': 'Recevez votre clé par e-mail', 'how.codeT': 'Recevez le code par e-mail', 'how.emailD': 'Généralement quelques minutes après le paiement.',
    'how.ownT': 'Appropriez-vous le compte', 'how.ownD': 'Connectez-vous et changez le mot de passe. Gardez l’e-mail associé au moins un mois.',
    'how.idT': 'Saisissez votre identifiant joueur', 'how.idD': 'Demandé lors de la commande — vérifiez-le bien.',
    'how.creditT': 'Les crédits arrivent en jeu', 'how.creditD': 'Ajoutés à votre compte en quelques minutes.',
    'how.redeemT': 'Utilisez-le sur {platform}', 'how.redeemD': 'Le solde arrive aussitôt dans votre portefeuille.',
    'how.activateT': 'Activez sur {platform}', 'how.activateD': 'Utilisez la clé et lancez le téléchargement.',

    'wish.title': 'Favoris', 'wish.total': '{price} au total', 'wish.addAll': 'Tout ajouter au panier',
    'wish.empty': 'Aucun favori pour l’instant', 'wish.emptyD': 'Touchez le cœur d’un produit pour le garder ici.',

    'co.title': 'Commande', 'co.digital': 'livraison numérique', 'co.demo': 'Commande de démonstration — aucun paiement n’est effectué.',
    'co.contact': 'Coordonnées', 'co.contactD': 'Vos codes et identifiants sont envoyés à cet e-mail.', 'co.name': 'Nom complet', 'co.email': 'E-mail', 'co.phone': 'Téléphone',
    'co.player': 'Identifiant joueur', 'co.playerD': 'Votre panier contient une recharge — elle est créditée sur cet identifiant.', 'co.playerPh': 'ex. 51 873 2290',
    'co.payment': 'Paiement', 'co.paymentLabel': 'Moyen de paiement', 'co.terms': 'J’accepte les conditions de vente et je comprends que les produits numériques sont livrés par e-mail.',
    'co.place': 'Valider · {total}', 'co.summary': 'Récapitulatif', 'co.each': '{price} l’unité', 'co.subtotal': 'Sous-total', 'co.delivery': 'Livraison',
    'co.free': 'Gratuite · par e-mail', 'co.total': 'Total', 'co.qtyOf': 'Quantité de {name}',
    'co.emptyT': 'Votre panier est vide', 'co.emptyD': 'Ajoutez d’abord un produit, la commande vous attendra.',
    'err.name': 'Saisissez votre nom complet.', 'err.email': 'Saisissez une adresse e-mail valide.', 'err.phone': 'Saisissez un numéro d’au moins 8 chiffres.',
    'err.player': 'Saisissez l’identifiant numérique de votre profil de jeu.', 'err.terms': 'Veuillez accepter les conditions pour continuer.',
    'pay.card': 'Carte bancaire', 'pay.cardD': 'Visa, Mastercard ou carte e-Dinar', 'pay.d17': 'D17', 'pay.d17D': 'Payez depuis l’application D17',
    'pay.transfer': 'Virement bancaire', 'pay.transferD': 'Livré à réception du virement',
    'co.fee.clictopay': 'Frais bancaires', 'co.fee.d17': 'Frais D17', 'co.fee.transfer': 'Frais de virement', 'pay.clictopay': 'Carte bancaire · ClicToPay', 'pay.clictopayD': 'Visa, Mastercard, CIB ou e-Dinar — sur la page sécurisée ClicToPay',
    'co.redirect': 'Ouverture de la page sécurisée ClicToPay…', 'co.redirectD': 'Démo — aucune carte n’est débitée.',
    'co.fromAccount': 'Rempli depuis votre compte', 'co.edit': 'Modifier', 'co.done': 'Terminé', 'co.saveToAccount': 'Enregistrer ces infos dans mon compte',
    'co.games': 'Comptes de jeu', 'co.gamesD': 'Chaque jeu se recharge à sa façon — un bloc par jeu.', 'co.remembered': 'Rempli depuis votre dernière commande',
    'acc.loginD': 'Nous nous connectons à votre compte de jeu, achetons la recharge, puis nous déconnectons.', 'acc.idD': 'Crédité directement sur cet identifiant en jeu.',
    'acc.email': 'E-mail du compte de jeu', 'acc.password': 'Mot de passe du compte de jeu', 'acc.uid': 'UID', 'acc.uidPh': 'ex. 512 873 229',
    'acc.platform': 'Téléphone', 'acc.android': 'Android', 'acc.ios': 'iOS', 'acc.show': 'Afficher le mot de passe', 'acc.hide': 'Masquer le mot de passe',
    'acc.never': 'Utilisé une seule fois pour cette recharge, jamais enregistré.',
    'err.gemail': 'Saisissez l’e-mail de votre compte de jeu.', 'err.gpass': 'Saisissez le mot de passe de votre compte de jeu.',
    'err.uid': 'Saisissez l’UID numérique de votre profil de jeu.', 'err.platform': 'Choisissez Android ou iOS.',
    'cred.loginCredited': 'Crédité sur le compte {email}', 'dlv.login': 'Nous nous connectons à votre compte de jeu et l’ajoutons pour vous',
    'how.gameLoginT': 'Donnez vos identifiants de jeu', 'how.gameLoginD': 'E-mail et mot de passe lors de la commande.', 'how.gameLoginFullD': 'E-mail, mot de passe, UID et Android ou iOS lors de la commande.',
    'pdp.region': 'Région', 'pdp.value': 'Valeur de la carte', 'pdp.amount': 'Quantité', 'pdp.otherBrands': 'Autres marques',
    'region.GL': 'Monde', 'region.FR': 'France', 'region.US': 'États-Unis', 'region.TR': 'Turquie', 'region.IN': 'Inde', 'region.EU': 'Europe',
    'fam.from': 'Dès {price}', 'fam.open': 'Voir les options {name}',

    'ord.thanks': 'Merci, {name} !', 'ord.thanksAnon': 'Merci !',
    'ord.doneD': 'La commande {id} est confirmée. Tout a été livré ci-dessous et à {email}.',
    'ord.pendD': 'La commande {id} est confirmée. Vos codes apparaîtront ici et seront envoyés à {email}.',
    'ord.title': 'Commande {id}', 'ord.progress': 'Suivi de commande', 'ord.placed': 'Passée', 'ord.paid': 'Payée', 'ord.delivered': 'Livrée', 'ord.delivering': 'Livraison…',
    'ord.byEmail': 'Par e-mail', 'ord.minutes': 'En général quelques minutes', 'ord.items': 'Articles', 'ord.preparing': 'Préparation de votre livraison…',
    'ord.summary': 'Récapitulatif', 'ord.payment': 'Paiement', 'ord.to': 'Livré à', 'ord.player': 'Identifiant joueur', 'ord.help': 'Besoin d’aide pour cette commande ?',
    'ord.fine': 'Tous les codes et identifiants de cette démo commencent par DEMO et ne sont pas réels.',
    'st.delivered': 'Livrée', 'st.processing': 'En cours',
    'cred.account': 'Identifiants du compte', 'cred.code': 'Code de la carte', 'cred.key': 'Clé d’activation', 'cred.topup': 'Recharge', 'cred.credited': 'Crédité sur l’identifiant {id}',
    'cred.reveal': 'Afficher', 'cred.hide': 'Masquer', 'cred.copy': 'Copier',
    'orders.title': 'Commandes', 'orders.total': '{price} au total',

    'pf.title': 'Profil', 'pf.since': 'Membre depuis {date}', 'pf.edit': 'Modifier le profil', 'pf.orders': 'Commandes', 'pf.spent': 'Total dépensé',
    'pf.keys': 'Clés et comptes', 'pf.wish': 'Favoris', 'pf.vault': 'Mes clés et comptes', 'pf.vaultD': 'Tout ce qui vous a été livré, au même endroit',
    'pf.noKeys': 'Aucune clé pour l’instant', 'pf.noKeysD': 'Les codes et identifiants achetés apparaîtront ici une fois livrés.', 'pf.recent': 'Commandes récentes', 'pf.all': 'Toutes les commandes',

    'set.title': 'Réglages', 'set.sub': 'Gérez votre compte ainsi que l’apparence et le comportement de la boutique.', 'set.sections': 'Sections des réglages',
    'set.profile': 'Profil', 'set.security': 'Sécurité', 'set.notifications': 'Notifications', 'set.appearance': 'Apparence', 'set.privacy': 'Confidentialité',
    'set.avatar': 'Avatar', 'set.details': 'Informations', 'set.name': 'Nom affiché', 'set.handle': 'Nom d’utilisateur', 'set.save': 'Enregistrer',
    'err.name2': 'Saisissez au moins 2 caractères.', 'err.handle': '3 à 20 lettres, chiffres, points ou tirets bas.', 'err.phone2': 'Saisissez au moins 8 chiffres.',
    'set.changePw': 'Changer le mot de passe', 'set.current': 'Mot de passe actuel', 'set.new': 'Nouveau mot de passe', 'set.confirm': 'Confirmer le mot de passe',
    'set.pwHint': 'Au moins 8 caractères, avec une lettre et un chiffre.', 'set.pwWeak': 'Faible — ajoutez de la longueur, des chiffres ou des symboles.', 'set.pwOk': 'Correct.', 'set.pwStrong': 'Mot de passe robuste.',
    'set.update': 'Modifier le mot de passe', 'err.current': 'Saisissez votre mot de passe actuel.', 'err.match': 'Les mots de passe ne correspondent pas.',
    'set.protect': 'Protection de la connexion', 'set.2fa': 'Validation en deux étapes', 'set.2faD': 'Demander un code à usage unique lors d’une connexion sur un nouvel appareil.',
    'set.tellMe': 'Me prévenir pour', 'set.nOrders': 'Suivi des commandes', 'set.nOrdersD': 'Paiement confirmé, codes livrés, recharges créditées.',
    'set.nStock': 'Retour en stock', 'set.nStockD': 'Quand un favori est de nouveau disponible.',
    'set.nPrice': 'Baisses de prix', 'set.nPriceD': 'Quand un favori devient moins cher.',
    'set.nNews': 'Actualités et offres', 'set.nNewsD': 'Nouveautés et promotions occasionnelles.',
    'set.sendBy': 'Envoyer par', 'set.chEmail': 'E-mail', 'set.chSms': 'SMS', 'set.chBoth': 'E-mail et SMS', 'set.channel': 'Canal de notification',
    'set.lang': 'Langue', 'set.langD': 'L’arabe affiche toute la mise en page de droite à gauche.',
    'set.accent': 'Couleur d’accent', 'set.motion': 'Animations', 'set.bg': 'Arrière-plan animé', 'set.bgD': 'La lumière qui dérive lentement derrière la boutique.',
    'set.rm': 'Réduire les animations', 'set.rmD': 'Désactive le défilement automatique, la parallaxe et les transitions.',
    'acc.teal': 'Bleu-vert TechGarage', 'acc.blue': 'Bleu', 'acc.violet': 'Violet', 'acc.orange': 'Orange', 'acc.pink': 'Rose',
    'set.privHint': 'Cette démo garde tout dans votre navigateur — rien n’est envoyé à un serveur.',
    'set.export': 'Télécharger mes données', 'set.exportD': 'Profil, préférences, panier, favoris et commandes dans un fichier JSON.', 'set.exportB': 'Télécharger',
    'set.clearV': 'Effacer les produits vus', 'set.clearB': 'Effacer',
    'set.reset': 'Tout réinitialiser', 'set.resetD': 'Vider le panier et les favoris, oublier les commandes et rétablir les réglages.', 'set.resetB': 'Réinitialiser', 'set.resetConfirm': 'Cliquez encore pour confirmer',

    'sup.title': 'Comment pouvons-nous vous aider ?', 'sup.sub': 'Appelez, écrivez ou passez à la boutique à Mahdia — ou trouvez une réponse ci-dessous.',
    'sup.call': 'Appelez-nous', 'sup.email': 'E-mail', 'sup.visit': 'Venir à la boutique', 'sup.hours': 'Horaires',
    'day.week': 'Lundi – vendredi', 'day.sat': 'Samedi', 'day.sun': 'Dimanche',
    'sup.faq': 'Questions fréquentes', 'sup.send': 'Envoyez-nous un message', 'sup.name': 'Nom', 'sup.order': 'Commande (facultatif)', 'sup.notOrder': 'Pas lié à une commande',
    'sup.msg': 'Message', 'sup.msgPh': 'Comment pouvons-nous vous aider ?', 'sup.sendB': 'Envoyer', 'sup.sendD': 'Ouvre votre messagerie avec le message prêt à envoyer à {email}.',
    'err.msg': 'Dites-nous-en un peu plus (au moins 10 caractères).', 'sup.subjOrder': 'Aide pour la commande {id}', 'sup.subjGeneral': 'Question depuis le site',
    'store.address': 'Rue Hssan Achoura, 5100 Mahdia, Tunisie',

    'nt.title': 'Notifications', 'nt.caught': 'Vous êtes à jour', 'nt.readAll': 'Tout marquer comme lu',
    'nt.hint': 'Choisissez vos alertes dans les {link}.', 'nt.link': 'réglages de notification',
    'n4.t': 'Clé livrée', 'n4.b': 'Les identifiants de votre compte EA FC 27 sont dans votre boîte mail.',
    'n3.t': 'De retour en stock', 'n3.b': 'Steam Wallet 50 USD est de nouveau disponible — {price}.',
    'n2.t': 'Baisse de prix', 'n2.b': 'La clé Windows 10/11 Pro passe à {price}.',
    'n1.t': 'Recharge effectuée', 'n1.b': '5000 pièces eFootball créditées sur votre compte.',
    'ago.m': '{n} min', 'ago.h': '{n} h', 'ago.d': '{n} j',

    'nf.title': 'Cette page n’existe pas', 'nf.text': 'Le lien est peut-être ancien, ou le produit n’est plus vendu.', 'nf.back': 'Retour à la boutique', 'nf.browse': 'Voir tous les produits',
    'demo.since': 'mars 2025'
  },

  ar: {
    'brand': 'تك غاراج',
    'cat.all': 'الرائج', 'cat.games': 'ألعاب الحاسوب', 'cat.cards': 'بطاقات الهدايا', 'cat.mobile': 'ألعاب الجوال', 'cat.software': 'البرامج',
    'cat.allProducts': 'كل المنتجات',
    'sub.accounts': 'حسابات جديدة', 'sub.keys': 'مفاتيح الألعاب', 'sub.topups': 'شحن الألعاب', 'sub.ps': 'ألعاب بلايستيشن',
    'sub.licenses': 'تراخيص البرامج', 'sub.apps': 'رصيد التطبيقات',
    'sub.all': 'الكل',

    'search.ph': 'ابحث في المتجر', 'search.label': 'البحث عن المنتجات', 'search.results': 'نتائج البحث',
    'search.empty': 'لا توجد نتائج لـ «{q}».', 'search.seeAll': 'عرض كل النتائج ({n})',
    'rail.sections': 'الأقسام', 'rail.store': 'المتجر', 'rail.wishlist': 'المفضلة', 'rail.basket': 'السلة', 'rail.profile': 'الملف الشخصي', 'rail.settings': 'الإعدادات',
    'bell': 'الإشعارات', 'notif.viewAll': 'عرض كل الإشعارات',
    'menu.profile': 'الملف الشخصي', 'menu.orders': 'الطلبات', 'menu.wishlist': 'المفضلة', 'menu.settings': 'الإعدادات', 'menu.support': 'المساعدة', 'menu.signout': 'تسجيل الخروج',
    'toast.signout': 'تسجيل الخروج غير متاح في هذا العرض التجريبي',
    'basket.title': 'سلّتك', 'basket.close': 'إغلاق السلة', 'basket.empty': 'سلّتك فارغة.', 'basket.total': 'المجموع', 'basket.checkout': 'إتمام الشراء',
    'basket.fewer': 'إنقاص واحد', 'basket.more': 'زيادة واحد',
    'lang.label': 'اللغة', 'lang.changed': 'اللغة: العربية',
    'tabs.label': 'الفئات', 'crumbs': 'مسار التنقل',

    'toast.added': 'تمت إضافة {name} إلى السلة', 'toast.saved': 'تمت الإضافة إلى المفضلة', 'toast.removed': 'تمت الإزالة من المفضلة',
    'toast.copied': 'تم النسخ', 'toast.done': 'تم الحفظ', 'toast.accent': 'تم تغيير اللون المميز', 'toast.profile': 'تم حفظ الملف الشخصي',
    'toast.password': 'تم تغيير كلمة المرور', 'toast.history': 'تم مسح السجل', 'toast.export': 'جارٍ تنزيل بياناتك',
    'toast.addedAll': 'تمت إضافة المفضلة إلى السلة', 'toast.delivered': 'تم تسليم الطلب {id}', 'toast.mail': 'جارٍ فتح تطبيق البريد…',

    'home.title': 'متجر الألعاب', 'home.newDrops': 'وصل حديثًا', 'home.sortBy': 'الترتيب:', 'sort.new': 'الأحدث', 'sort.low': 'السعر ↑', 'sort.high': 'السعر ↓', 'sort.az': 'أ – ي',
    'home.recent': 'شوهد مؤخرًا', 'home.viewedRecently': 'شوهد مؤخرًا', 'home.inBasket': 'في سلّتك', 'home.deliveredOn': 'تم التسليم · {date}', 'home.viewedYesterday': 'شوهد أمس',
    'home.youMightLike': 'قد يعجبك أيضًا', 'home.seeAll': 'عرض الكل', 'home.trending': 'الأكثر رواجًا', 'home.featured': 'منتجات مميزة',
    'buy.now': 'اشترِ الآن', 'buy.add': 'أضف إلى السلة', 'buy.addNamed': 'أضف {name} إلى السلة', 'buy.more': 'المزيد عن {name}',
    'note.instant': 'تسليم فوري', 'note.minutes': 'يُضاف خلال دقائق', 'slide': 'الشريحة {n}', 'prev': 'السابق', 'next': 'التالي',
    'heart.save': 'أضف {name} إلى المفضلة', 'heart.remove': 'أزل {name} من المفضلة',

    'shop.title': 'المتجر', 'shop.results': 'نتائج «{q}»', 'shop.category': 'الفئة', 'shop.price': 'السعر', 'shop.sort': 'الترتيب',
    'shop.filters': 'عوامل التصفية', 'shop.clear': 'مسح عوامل التصفية', 'shop.none': 'لا توجد نتائج', 'shop.noneQ': 'لا توجد منتجات تطابق «{q}» مع عوامل التصفية هذه.',
    'shop.nonePrice': 'لا توجد منتجات في هذا النطاق السعري.', 'shop.browse': 'تصفّح المتجر', 'shop.allIn': 'كل {cat}',
    'price.any': 'كل الأسعار', 'price.0-50': 'أقل من 50 د.ت', 'price.50-100': '50 – 100 د.ت', 'price.100-200': '100 – 200 د.ت', 'price.200-': '200 د.ت فأكثر',
    'ssort.featured': 'المميزة', 'ssort.low': 'السعر: من الأقل', 'ssort.high': 'السعر: من الأعلى', 'ssort.az': 'الاسم: أ – ي',
    'home': 'الرئيسية',

    'pdp.tax': 'شامل الضريبة', 'pdp.qty': 'الكمية', 'pdp.source': 'عرض على techgarage.tn', 'pdp.how': 'كيف يعمل', 'pdp.details': 'التفاصيل',
    'pdp.related': 'قد يعجبك أيضًا', 'pdp.moreIn': 'المزيد في {cat}', 'pdp.notFound': 'المنتج غير موجود',
    'spec.product': 'المنتج', 'spec.category': 'الفئة', 'spec.platform': 'المنصة', 'spec.type': 'النوع', 'spec.includes': 'يتضمن',
    'spec.delivery': 'التسليم', 'spec.price': 'السعر', 'spec.priceTax': '{price} · شامل الضريبة',
    'dlv.account': 'حساب جديد يُسلَّم عبر البريد الإلكتروني', 'dlv.key': 'مفتاح تفعيل يُسلَّم عبر البريد الإلكتروني',
    'dlv.code': 'رمز بطاقة هدية يُسلَّم عبر البريد الإلكتروني', 'dlv.topup': 'يُضاف إلى معرّف اللاعب الخاص بك',
    'how.pay': 'ادفع بأمان', 'how.payD': 'أتمم الشراء في دقيقة دون إنشاء حساب.', 'how.payShort': 'أتمم الشراء في دقيقة.',
    'how.loginT': 'استلم بيانات الدخول عبر البريد', 'how.keyT': 'استلم مفتاحك عبر البريد', 'how.codeT': 'استلم الرمز عبر البريد', 'how.emailD': 'عادةً خلال دقائق من الدفع.',
    'how.ownT': 'اجعله حسابك', 'how.ownD': 'سجّل الدخول وغيّر كلمة المرور، واحتفظ بالبريد المرتبط شهرًا على الأقل.',
    'how.idT': 'أدخل معرّف اللاعب', 'how.idD': 'يُطلب عند إتمام الشراء — تحقّق منه جيدًا.',
    'how.creditT': 'يصل الرصيد إلى اللعبة', 'how.creditD': 'يُضاف إلى حسابك خلال دقائق.',
    'how.redeemT': 'استخدمه على {platform}', 'how.redeemD': 'يصل الرصيد إلى محفظتك فورًا.',
    'how.activateT': 'فعّله على {platform}', 'how.activateD': 'استخدم المفتاح وابدأ التنزيل.',

    'wish.title': 'المفضلة', 'wish.total': 'المجموع {price}', 'wish.addAll': 'أضف الكل إلى السلة',
    'wish.empty': 'لا شيء في المفضلة بعد', 'wish.emptyD': 'اضغط على القلب في أي منتج لحفظه هنا.',

    'co.title': 'إتمام الشراء', 'co.digital': 'تسليم رقمي', 'co.demo': 'شراء تجريبي — لا يتم أخذ أي مبلغ.',
    'co.contact': 'بيانات الاتصال', 'co.contactD': 'تُرسَل الرموز وبيانات الدخول إلى هذا البريد.', 'co.name': 'الاسم الكامل', 'co.email': 'البريد الإلكتروني', 'co.phone': 'الهاتف',
    'co.player': 'معرّف اللاعب', 'co.playerD': 'سلّتك تحتوي على شحن — يُضاف إلى هذا المعرّف داخل اللعبة.', 'co.playerPh': '51 873 2290',
    'co.payment': 'الدفع', 'co.paymentLabel': 'طريقة الدفع', 'co.terms': 'أوافق على شروط البيع وأعلم أن المنتجات الرقمية تُسلَّم عبر البريد الإلكتروني.',
    'co.place': 'تأكيد الطلب · {total}', 'co.summary': 'ملخّص الطلب', 'co.each': '{price} للواحد', 'co.subtotal': 'المجموع الفرعي', 'co.delivery': 'التسليم',
    'co.free': 'مجاني · عبر البريد', 'co.total': 'المجموع', 'co.qtyOf': 'كمية {name}',
    'co.emptyT': 'سلّتك فارغة', 'co.emptyD': 'أضف منتجًا أولًا، وصفحة الشراء بانتظارك.',
    'err.name': 'أدخل اسمك الكامل.', 'err.email': 'أدخل بريدًا إلكترونيًا صحيحًا.', 'err.phone': 'أدخل رقم هاتف من 8 أرقام على الأقل.',
    'err.player': 'أدخل المعرّف الرقمي من ملفك في اللعبة.', 'err.terms': 'يرجى الموافقة على الشروط للمتابعة.',
    'pay.card': 'بطاقة بنكية', 'pay.cardD': 'Visa أو Mastercard أو بطاقة e-Dinar', 'pay.d17': 'D17', 'pay.d17D': 'ادفع من تطبيق D17',
    'pay.transfer': 'تحويل بنكي', 'pay.transferD': 'يُسلَّم عند وصول التحويل',
    'co.fee.clictopay': 'رسوم بنكية', 'co.fee.d17': 'رسوم D17', 'co.fee.transfer': 'رسوم التحويل', 'pay.clictopay': 'بطاقة بنكية · ClicToPay', 'pay.clictopayD': 'Visa أو Mastercard أو CIB أو e-Dinar — عبر صفحة ClicToPay الآمنة',
    'co.redirect': 'جارٍ فتح صفحة ClicToPay الآمنة…', 'co.redirectD': 'نسخة تجريبية — لا يتم خصم أي مبلغ.',
    'co.fromAccount': 'مُعبّأ من حسابك', 'co.edit': 'تعديل', 'co.done': 'تم', 'co.saveToAccount': 'حفظ هذه البيانات في حسابي',
    'co.games': 'حسابات الألعاب', 'co.gamesD': 'لكل لعبة طريقة شحن خاصة — خانة لكل لعبة.', 'co.remembered': 'مُعبّأ من طلبك السابق',
    'acc.loginD': 'نسجّل الدخول إلى حساب لعبتك، نشتري الشحن، ثم نسجّل الخروج.', 'acc.idD': 'يُضاف مباشرة إلى هذا المعرّف داخل اللعبة.',
    'acc.email': 'البريد الإلكتروني لحساب اللعبة', 'acc.password': 'كلمة مرور حساب اللعبة', 'acc.uid': 'UID', 'acc.uidPh': '512 873 229',
    'acc.platform': 'الهاتف', 'acc.android': 'Android', 'acc.ios': 'iOS', 'acc.show': 'إظهار كلمة المرور', 'acc.hide': 'إخفاء كلمة المرور',
    'acc.never': 'تُستعمل مرة واحدة لهذا الشحن ولا تُحفَظ أبدًا.',
    'err.gemail': 'أدخل البريد الإلكتروني لحساب لعبتك.', 'err.gpass': 'أدخل كلمة مرور حساب لعبتك.',
    'err.uid': 'أدخل الـUID الرقمي من ملفك في اللعبة.', 'err.platform': 'اختر Android أو iOS.',
    'cred.loginCredited': 'أُضيف إلى الحساب {email}', 'dlv.login': 'نسجّل الدخول إلى حساب لعبتك ونضيفه لك',
    'how.gameLoginT': 'أعطِنا بيانات دخول اللعبة', 'how.gameLoginD': 'البريد الإلكتروني وكلمة المرور عند الشراء.', 'how.gameLoginFullD': 'البريد الإلكتروني وكلمة المرور والـUID وAndroid أو iOS عند الشراء.',
    'pdp.region': 'المنطقة', 'pdp.value': 'قيمة البطاقة', 'pdp.amount': 'الكمية', 'pdp.otherBrands': 'علامات أخرى',
    'region.GL': 'عالمي', 'region.FR': 'فرنسا', 'region.US': 'الولايات المتحدة', 'region.TR': 'تركيا', 'region.IN': 'الهند', 'region.EU': 'أوروبا',
    'fam.from': 'ابتداءً من {price}', 'fam.open': 'عرض خيارات {name}',

    'ord.thanks': 'شكرًا لك يا {name}!', 'ord.thanksAnon': 'شكرًا لك!',
    'ord.doneD': 'تم تأكيد الطلب {id}. تم تسليم كل شيء أدناه وإلى {email}.',
    'ord.pendD': 'تم تأكيد الطلب {id}. ستظهر الرموز هنا وتُرسَل إلى {email}.',
    'ord.title': 'الطلب {id}', 'ord.progress': 'مراحل الطلب', 'ord.placed': 'تم الطلب', 'ord.paid': 'تم الدفع', 'ord.delivered': 'تم التسليم', 'ord.delivering': 'جارٍ التسليم…',
    'ord.byEmail': 'عبر البريد', 'ord.minutes': 'عادةً خلال دقائق', 'ord.items': 'المنتجات', 'ord.preparing': 'جارٍ تجهيز طلبك…',
    'ord.summary': 'الملخّص', 'ord.payment': 'الدفع', 'ord.to': 'سُلِّم إلى', 'ord.player': 'معرّف اللاعب', 'ord.help': 'هل تحتاج مساعدة في هذا الطلب؟',
    'ord.fine': 'كل الرموز وبيانات الدخول في هذا العرض التجريبي تبدأ بـ DEMO وليست حقيقية.',
    'st.delivered': 'تم التسليم', 'st.processing': 'قيد التنفيذ',
    'cred.account': 'بيانات دخول الحساب', 'cred.code': 'رمز البطاقة', 'cred.key': 'مفتاح التفعيل', 'cred.topup': 'شحن', 'cred.credited': 'أُضيف إلى معرّف اللاعب {id}',
    'cred.reveal': 'إظهار', 'cred.hide': 'إخفاء', 'cred.copy': 'نسخ',
    'orders.title': 'الطلبات', 'orders.total': 'المجموع {price}',

    'pf.title': 'الملف الشخصي', 'pf.since': 'عضو منذ {date}', 'pf.edit': 'تعديل الملف', 'pf.orders': 'الطلبات', 'pf.spent': 'إجمالي الإنفاق',
    'pf.keys': 'المفاتيح والحسابات', 'pf.wish': 'المفضلة', 'pf.vault': 'مفاتيحي وحساباتي', 'pf.vaultD': 'كل ما تم تسليمه إليك في مكان واحد',
    'pf.noKeys': 'لا توجد مفاتيح بعد', 'pf.noKeysD': 'ستظهر هنا الرموز وبيانات الدخول التي تشتريها بعد تسليمها.', 'pf.recent': 'أحدث الطلبات', 'pf.all': 'كل الطلبات',

    'set.title': 'الإعدادات', 'set.sub': 'أدِر حسابك وطريقة ظهور المتجر وعمله.', 'set.sections': 'أقسام الإعدادات',
    'set.profile': 'الملف الشخصي', 'set.security': 'الأمان', 'set.notifications': 'الإشعارات', 'set.appearance': 'المظهر', 'set.privacy': 'الخصوصية والبيانات',
    'set.avatar': 'الصورة الرمزية', 'set.details': 'البيانات', 'set.name': 'الاسم المعروض', 'set.handle': 'اسم المستخدم', 'set.save': 'حفظ التغييرات',
    'err.name2': 'أدخل حرفين على الأقل.', 'err.handle': 'من 3 إلى 20 حرفًا أو رقمًا أو نقطة أو شرطة سفلية.', 'err.phone2': 'أدخل 8 أرقام على الأقل.',
    'set.changePw': 'تغيير كلمة المرور', 'set.current': 'كلمة المرور الحالية', 'set.new': 'كلمة المرور الجديدة', 'set.confirm': 'تأكيد كلمة المرور',
    'set.pwHint': '8 أحرف على الأقل، تتضمن حرفًا ورقمًا.', 'set.pwWeak': 'ضعيفة — أضف طولًا أو أرقامًا أو رموزًا.', 'set.pwOk': 'جيدة.', 'set.pwStrong': 'كلمة مرور قوية.',
    'set.update': 'تحديث كلمة المرور', 'err.current': 'أدخل كلمة المرور الحالية.', 'err.match': 'كلمتا المرور غير متطابقتين.',
    'set.protect': 'حماية تسجيل الدخول', 'set.2fa': 'التحقق بخطوتين', 'set.2faD': 'طلب رمز لمرة واحدة عند تسجيل الدخول من جهاز جديد.',
    'set.tellMe': 'أعلمني بـ', 'set.nOrders': 'تحديثات الطلبات', 'set.nOrdersD': 'تأكيد الدفع وتسليم الرموز وإضافة الشحن.',
    'set.nStock': 'العودة إلى المخزون', 'set.nStockD': 'عندما يتوفر منتج من مفضلتك مجددًا.',
    'set.nPrice': 'انخفاض الأسعار', 'set.nPriceD': 'عندما ينخفض سعر منتج في مفضلتك.',
    'set.nNews': 'الأخبار والعروض', 'set.nNewsD': 'الإصدارات الجديدة والعروض العرضية.',
    'set.sendBy': 'أرسلها عبر', 'set.chEmail': 'البريد', 'set.chSms': 'رسائل SMS', 'set.chBoth': 'البريد وSMS', 'set.channel': 'قناة الإشعارات',
    'set.lang': 'اللغة', 'set.langD': 'العربية تقلب تخطيط الموقع بالكامل من اليمين إلى اليسار.',
    'set.accent': 'اللون المميز', 'set.motion': 'الحركة', 'set.bg': 'خلفية متحركة', 'set.bgD': 'الضوء الذي ينساب ببطء خلف المتجر.',
    'set.rm': 'تقليل الحركة', 'set.rmD': 'إيقاف التمرير التلقائي والمنظور المتحرك والانتقالات.',
    'acc.teal': 'أخضر تك غاراج', 'acc.blue': 'أزرق', 'acc.violet': 'بنفسجي', 'acc.orange': 'برتقالي', 'acc.pink': 'وردي',
    'set.privHint': 'يحتفظ هذا العرض التجريبي بكل شيء في متصفحك — لا يُرسَل شيء إلى خادم.',
    'set.export': 'تنزيل بياناتي', 'set.exportD': 'الملف الشخصي والتفضيلات والسلة والمفضلة والطلبات في ملف JSON.', 'set.exportB': 'تنزيل',
    'set.clearV': 'مسح ما شوهد مؤخرًا', 'set.clearB': 'مسح',
    'set.reset': 'إعادة ضبط كل شيء', 'set.resetD': 'إفراغ السلة والمفضلة وحذف الطلبات واستعادة الإعدادات الافتراضية.', 'set.resetB': 'إعادة الضبط', 'set.resetConfirm': 'اضغط مجددًا للتأكيد',

    'sup.title': 'كيف يمكننا مساعدتك؟', 'sup.sub': 'اتصل بنا أو راسلنا أو زر المتجر في المهدية — أو اعثر على إجابة سريعة أدناه.',
    'sup.call': 'اتصل بنا', 'sup.email': 'البريد الإلكتروني', 'sup.visit': 'زر المتجر', 'sup.hours': 'ساعات العمل',
    'day.week': 'الاثنين – الجمعة', 'day.sat': 'السبت', 'day.sun': 'الأحد',
    'sup.faq': 'الأسئلة الشائعة', 'sup.send': 'أرسل لنا رسالة', 'sup.name': 'الاسم', 'sup.order': 'الطلب (اختياري)', 'sup.notOrder': 'لا يتعلق بطلب',
    'sup.msg': 'الرسالة', 'sup.msgPh': 'كيف يمكننا مساعدتك؟', 'sup.sendB': 'إرسال', 'sup.sendD': 'يفتح تطبيق البريد برسالة جاهزة للإرسال إلى {email}.',
    'err.msg': 'أخبرنا بالمزيد (10 أحرف على الأقل).', 'sup.subjOrder': 'مساعدة بخصوص الطلب {id}', 'sup.subjGeneral': 'سؤال من الموقع',
    'store.address': 'نهج حسان عاشورة، 5100 المهدية، تونس',

    'nt.title': 'الإشعارات', 'nt.caught': 'لا جديد — اطّلعت على كل شيء', 'nt.readAll': 'تعليم الكل كمقروء',
    'nt.hint': 'اختر ما تريد أن نُعلمك به من {link}.', 'nt.link': 'إعدادات الإشعارات',
    'n4.t': 'تم تسليم المفتاح', 'n4.b': 'بيانات حساب EA FC 27 في بريدك الآن.',
    'n3.t': 'عاد إلى المخزون', 'n3.b': 'بطاقة Steam Wallet 50 USD متوفرة مجددًا — {price}.',
    'n2.t': 'انخفاض السعر', 'n2.b': 'مفتاح Windows 10/11 Pro أصبح بـ {price}.',
    'n1.t': 'تم الشحن', 'n1.b': 'أُضيفت 5000 عملة eFootball إلى حسابك.',
    'ago.m': '{n} د', 'ago.h': '{n} س', 'ago.d': '{n} ي',

    'nf.title': 'هذه الصفحة غير موجودة', 'nf.text': 'ربما يكون الرابط قديمًا أو أن المنتج لم يعد متوفرًا.', 'nf.back': 'العودة إلى المتجر', 'nf.browse': 'تصفّح كل المنتجات',
    'demo.since': 'مارس 2025'
  }
};

/* Counted phrases, keyed by CLDR plural category. */
const PLURAL = {
  en: {
    products: { one: '{n} product', other: '{n} products' },
    items:    { one: '{n} item', other: '{n} items' },
    saved:    { one: '{n} saved item', other: '{n} saved items' },
    orders:   { one: '{n} order', other: '{n} orders' },
    unread:   { one: '{n} unread', other: '{n} unread' },
    options:  { one: '{n} option', other: '{n} options' },
    history:  { one: '{n} product in your history.', other: '{n} products in your history.' }
  },
  fr: {
    products: { one: '{n} produit', other: '{n} produits' },
    items:    { one: '{n} article', other: '{n} articles' },
    saved:    { one: '{n} favori', other: '{n} favoris' },
    orders:   { one: '{n} commande', other: '{n} commandes' },
    unread:   { one: '{n} non lue', other: '{n} non lues' },
    options:  { one: '{n} option', other: '{n} options' },
    history:  { one: '{n} produit dans votre historique.', other: '{n} produits dans votre historique.' }
  },
  ar: {
    products: { zero: 'لا توجد منتجات', one: 'منتج واحد', two: 'منتجان', few: '{n} منتجات', many: '{n} منتجًا', other: '{n} منتج' },
    items:    { zero: 'لا عناصر', one: 'عنصر واحد', two: 'عنصران', few: '{n} عناصر', many: '{n} عنصرًا', other: '{n} عنصر' },
    saved:    { zero: 'لا محفوظات', one: 'منتج محفوظ واحد', two: 'منتجان محفوظان', few: '{n} منتجات محفوظة', many: '{n} منتجًا محفوظًا', other: '{n} منتج محفوظ' },
    orders:   { zero: 'لا طلبات', one: 'طلب واحد', two: 'طلبان', few: '{n} طلبات', many: '{n} طلبًا', other: '{n} طلب' },
    unread:   { zero: 'لا إشعارات غير مقروءة', one: 'إشعار واحد غير مقروء', two: 'إشعاران غير مقروءين', few: '{n} إشعارات غير مقروءة', many: '{n} إشعارًا غير مقروء', other: '{n} إشعار غير مقروء' },
    options:  { zero: 'لا خيارات', one: 'خيار واحد', two: 'خياران', few: '{n} خيارات', many: '{n} خيارًا', other: '{n} خيار' },
    history:  { zero: 'السجل فارغ.', one: 'منتج واحد في سجلك.', two: 'منتجان في سجلك.', few: '{n} منتجات في سجلك.', many: '{n} منتجًا في سجلك.', other: '{n} منتج في سجلك.' }
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Product vocabulary — tags, specs and badges
   ══════════════════════════════════════════════════════════════════════ */
const VOCAB = {
  'Fresh Steam Account': ['Compte Steam neuf', 'حساب Steam جديد'], 'Fresh Account': ['Compte neuf', 'حساب جديد'],
  'FPS': ['FPS', 'تصويب'], 'Sports': ['Sport', 'رياضة'], 'RPG': ['RPG', 'تقمّص أدوار'], 'Global Key': ['Clé mondiale', 'مفتاح عالمي'],
  'Steam Key': ['Clé Steam', 'مفتاح Steam'], 'Tactical': ['Tactique', 'تكتيكي'], 'Action': ['Action', 'أكشن'], 'Co-op': ['Coop', 'تعاوني'],
  'Simulation': ['Simulation', 'محاكاة'], 'Story': ['Narratif', 'قصصي'], 'Racing': ['Course', 'سباق'], 'Open World': ['Monde ouvert', 'عالم مفتوح'],
  'Sandbox': ['Bac à sable', 'عالم حر'], 'Gift Card': ['Carte cadeau', 'بطاقة هدية'], 'Software': ['Logiciel', 'برنامج'], 'Licence': ['Licence', 'ترخيص'],
  'Subscription': ['Abonnement', 'اشتراك'], 'Top-up': ['Recharge', 'شحن'], 'Bundle': ['Pack', 'حزمة'], 'Pass': ['Pass', 'باس'],
  'In-game currency': ['Monnaie du jeu', 'عملة اللعبة'], 'Boost': ['Boost', 'تعزيز'], 'PS5 game': ['Jeu PS5', 'لعبة PS5'],
  'Security': ['Sécurité', 'حماية'], 'Office': ['Bureautique', 'برامج مكتبية'], 'App credit': ['Crédit appli', 'رصيد تطبيق'],
  'Now trending': ['Tendance', 'رائج الآن'], 'New season': ['Nouvelle saison', 'موسم جديد'], 'New': ['Nouveau', 'جديد'],
  'Best seller': ['Meilleure vente', 'الأكثر مبيعًا'], 'Best value': ['Meilleur rapport', 'أفضل قيمة'], 'Cheapest': ['Le moins cher', 'الأرخص'],
  'Standard Edition': ['Édition Standard', 'الإصدار القياسي'], 'Instant delivery': ['Livraison instantanée', 'تسليم فوري'],
  'Base game': ['Jeu de base', 'اللعبة الأساسية'], 'Global': ['Mondial', 'عالمي'], 'Remastered': ['Remasterisé', 'نسخة محسّنة'],
  'Europe': ['Europe', 'أوروبا'], 'France': ['France', 'فرنسا'], 'United States': ['États-Unis', 'الولايات المتحدة'], 'Turkey': ['Turquie', 'تركيا'],
  'India': ['Inde', 'الهند'], 'Fast top-up': ['Recharge rapide', 'شحن سريع'], 'By player ID': ['Par identifiant joueur', 'عبر معرّف اللاعب'],
  'All platforms': ['Toutes plateformes', 'كل المنصات'], '1 device': ['1 appareil', 'جهاز واحد'], '1 month': ['1 mois', 'شهر واحد'],
  '1000 coins': ['1000 pièces', '1000 عملة'], '5000 coins': ['5000 pièces', '5000 عملة']
};

/* Hand-written descriptions for the original catalogue. */
const BLURB = {
  fr: {
    'bo7': 'Le tout dernier Black Ops, livré sur un compte Steam neuf. Remise immédiate après le paiement.',
    'fc27': 'Le FC de cette saison sur un compte Steam neuf. Changez le mot de passe dès réception.',
    'elden-ring': 'Les Terres Intermédiaires, sur un compte neuf. L’une des meilleures ventes de la boutique.',
    'ac-shadows': 'Le Japon féodal, deux héros. Une clé Ubisoft Connect mondiale, sans restriction de région.',
    'wukong': 'Le RPG d’action inspiré du Voyage vers l’Ouest dont tout le monde a parlé. Compte Steam neuf.',
    'ready-or-not': 'Tactique policière en combat rapproché. Clé Steam mondiale, activable partout.',
    'split-fiction': 'Coopération à deux par l’équipe d’It Takes Two. Pass ami inclus.',
    'inzoi': 'Une simulation de vie à l’éditeur de personnages bluffant.',
    'tlou2': 'La version PC de la Partie II, sur un compte Steam neuf.',
    'nba2k26': 'Le 2K de l’année sur un compte neuf, prêt pour MaCarrière.',
    'f1-2025': 'La saison officielle de F1 sur un compte Steam neuf.',
    'gta5': 'Toujours Los Santos. Compte Steam neuf au prix habituel de la boutique.',
    'minecraft': 'Les deux éditions sur un seul compte, via le Windows Store.',
    'steam-20': 'Vingt dollars de crédit Steam, livrés sous forme de clé.',
    'steam-50': 'Cinquante dollars de crédit Steam — de quoi s’offrir une nouveauté.',
    'psn-20': 'Vingt euros de crédit PSN pour les comptes de la région France.',
    'itunes-20': 'Vingt dollars de crédit App Store et iTunes pour les comptes américains.',
    'valorant-20': 'Des Valorant Points pour la région Europe.',
    'lol-20': 'Des Riot Points pour League of Legends sur les serveurs européens.',
    'efootball-1000': 'Mille pièces eFootball, créditées directement sur votre compte.',
    'efootball-5000': 'Le grand pack — cinq mille pièces pour la nouvelle saison.',
    'pubg-3850': '3850 UC, rechargés via votre identifiant joueur.',
    'win11': 'Une licence Pro pour Windows 10 ou 11, à vingt dinars.',
    'nitro-1m': 'Un mois de Nitro : envois plus lourds, streaming HD, emojis personnalisés partout.'
  },
  ar: {
    'bo7': 'أحدث إصدار من Black Ops، يُسلَّم على حساب Steam جديد. تسليم فوري بعد الدفع.',
    'fc27': 'إصدار FC لهذا الموسم على حساب Steam جديد. غيّر كلمة المرور فور الاستلام.',
    'elden-ring': 'الأراضي البينية على حساب جديد. من أكثر المنتجات مبيعًا في المتجر.',
    'ac-shadows': 'اليابان الإقطاعية وبطلان. مفتاح Ubisoft Connect عالمي بلا قيود إقليمية.',
    'wukong': 'لعبة الأكشن المستوحاة من «رحلة إلى الغرب» التي شغلت الجميع. حساب Steam جديد.',
    'ready-or-not': 'تكتيكات شرطية في القتال القريب. مفتاح Steam عالمي يعمل في أي مكان.',
    'split-fiction': 'لعب تعاوني لشخصين من فريق It Takes Two، مع تصريح الصديق.',
    'inzoi': 'محاكاة حياة مع أداة مذهلة لإنشاء الشخصيات.',
    'tlou2': 'نسخة الحاسوب من الجزء الثاني على حساب Steam جديد.',
    'nba2k26': 'إصدار 2K لهذا العام على حساب جديد، جاهز لوضع MyCareer.',
    'f1-2025': 'موسم F1 الرسمي على حساب Steam جديد.',
    'gta5': 'لوس سانتوس كما عهدتها. حساب Steam جديد بسعر المتجر المعتاد.',
    'minecraft': 'الإصداران معًا على حساب واحد عبر متجر Windows.',
    'steam-20': 'عشرون دولارًا في محفظة Steam، تُسلَّم كمفتاح.',
    'steam-50': 'خمسون دولارًا في محفظة Steam — تكفي لشراء إصدار جديد.',
    'psn-20': 'عشرون يورو من رصيد PSN لحسابات منطقة فرنسا.',
    'itunes-20': 'عشرون دولارًا من رصيد App Store وiTunes للحسابات الأمريكية.',
    'valorant-20': 'نقاط Valorant لمنطقة أوروبا.',
    'lol-20': 'نقاط Riot للعبة League of Legends على الخوادم الأوروبية.',
    'efootball-1000': 'ألف عملة eFootball تُضاف مباشرة إلى حسابك.',
    'efootball-5000': 'الحزمة الكبيرة — خمسة آلاف عملة للموسم الجديد.',
    'pubg-3850': '3850 UC تُشحن عبر معرّف اللاعب.',
    'win11': 'ترخيص Pro لنظام Windows 10 أو 11 بعشرين دينارًا.',
    'nitro-1m': 'شهر من Nitro: ملفات أكبر وبث بجودة HD ورموز تعبيرية مخصصة في كل مكان.'
  }
};

/* Descriptions for products added from the store's subcategories,
   chosen by product type. {name} is the product's display name. */
const TEMPLATE = {
  en: {
    card: '{name} — delivered as a code by email, ready to redeem in seconds.',
    sub: '{name}, delivered by email and activated on your account.',
    credit: '{name}, credited to your game account within minutes.',
    game: '{name}, a digital PlayStation game delivered to your PSN account.',
    licence: 'A {name} licence, delivered as a key by email.',
    app: '{name}, credited to your app account within minutes.'
  },
  fr: {
    card: '{name} — livré par e-mail sous forme de code, à utiliser en quelques secondes.',
    sub: '{name}, livré par e-mail et activé sur votre compte.',
    credit: '{name}, crédité sur votre compte de jeu en quelques minutes.',
    game: '{name}, un jeu PlayStation numérique livré sur votre compte PSN.',
    licence: 'Une licence {name}, livrée par e-mail sous forme de clé.',
    app: '{name}, crédité sur votre compte d’application en quelques minutes.'
  },
  ar: {
    card: '{name} — يُسلَّم كرمز عبر البريد الإلكتروني وجاهز للاستخدام خلال ثوانٍ.',
    sub: '{name}، يُسلَّم عبر البريد الإلكتروني ويُفعَّل على حسابك.',
    credit: '{name}، يُضاف إلى حساب اللعبة خلال دقائق.',
    game: '{name}، لعبة بلايستيشن رقمية تُسلَّم إلى حساب PSN الخاص بك.',
    licence: 'ترخيص {name} يُسلَّم كمفتاح عبر البريد الإلكتروني.',
    app: '{name}، يُضاف إلى حسابك في التطبيق خلال دقائق.'
  }
};
const TEMPLATE_FOR = {
  'Gift Card': 'card', 'Subscription': 'sub', 'Top-up': 'credit', 'In-game currency': 'credit', 'Bundle': 'credit',
  'Pass': 'credit', 'Boost': 'credit', 'PS5 game': 'game', 'Security': 'licence', 'Office': 'licence', 'App credit': 'app'
};

const FAQ = {
  en: [
    ['How fast is delivery?', 'Digital orders are delivered by email, usually within minutes of payment. Mobile top-ups are credited straight to the player ID you give at checkout.'],
    ['What is a “fresh Steam account”?', 'A new Steam account with the game already on it. You receive the login and the account is yours — change the password as soon as it arrives.'],
    ['Can I change the email on an account I bought?', 'The store advises keeping the linked email unchanged for at least a month after you receive the account. Changing the password straight away is fine.'],
    ['Which region do gift cards work in?', 'The region is in each card’s name — PlayStation 20 EUR (FR) works on French PSN accounts, Apple iTunes 20 USD on US accounts. Check your account region before buying.'],
    ['How do mobile top-ups work?', 'Enter your in-game player ID at checkout. The coins or UC are credited to that account, so double-check the ID before you pay.'],
    ['A key or code doesn’t work. What now?', 'Contact us with your order number and a screenshot of the error, by phone or email, and we’ll look into it.']
  ],
  fr: [
    ['Quel est le délai de livraison ?', 'Les commandes numériques sont livrées par e-mail, généralement quelques minutes après le paiement. Les recharges mobiles sont créditées directement sur l’identifiant joueur indiqué lors de la commande.'],
    ['Qu’est-ce qu’un « compte Steam neuf » ?', 'Un nouveau compte Steam sur lequel le jeu est déjà présent. Vous recevez les identifiants et le compte vous appartient — changez le mot de passe dès réception.'],
    ['Puis-je changer l’e-mail d’un compte acheté ?', 'La boutique conseille de garder l’e-mail associé au moins un mois après la réception du compte. Vous pouvez en revanche changer le mot de passe tout de suite.'],
    ['Dans quelle région fonctionnent les cartes cadeaux ?', 'La région figure dans le nom de chaque carte — PlayStation 20 EUR (FR) fonctionne sur les comptes PSN français, Apple iTunes 20 USD sur les comptes américains. Vérifiez la région de votre compte avant d’acheter.'],
    ['Comment fonctionnent les recharges mobiles ?', 'Saisissez votre identifiant joueur lors de la commande. Les pièces ou UC sont créditées sur ce compte : vérifiez bien l’identifiant avant de payer.'],
    ['Une clé ou un code ne fonctionne pas. Que faire ?', 'Contactez-nous par téléphone ou par e-mail avec votre numéro de commande et une capture de l’erreur, et nous nous en occupons.']
  ],
  ar: [
    ['ما مدة التسليم؟', 'تُسلَّم الطلبات الرقمية عبر البريد الإلكتروني، عادةً خلال دقائق من الدفع. ويُضاف شحن ألعاب الجوال مباشرة إلى معرّف اللاعب الذي تُدخله عند الشراء.'],
    ['ما هو «حساب Steam الجديد»؟', 'حساب Steam جديد تكون اللعبة موجودة عليه مسبقًا. تستلم بيانات الدخول ويصبح الحساب ملكك — غيّر كلمة المرور فور استلامه.'],
    ['هل يمكنني تغيير البريد الإلكتروني لحساب اشتريته؟', 'ينصح المتجر بالإبقاء على البريد المرتبط دون تغيير لمدة شهر على الأقل بعد الاستلام. أما تغيير كلمة المرور فوريًا فلا مشكلة فيه.'],
    ['في أي منطقة تعمل بطاقات الهدايا؟', 'المنطقة مذكورة في اسم كل بطاقة — PlayStation 20 EUR (FR) تعمل على حسابات PSN الفرنسية، وApple iTunes 20 USD على الحسابات الأمريكية. تحقّق من منطقة حسابك قبل الشراء.'],
    ['كيف يعمل شحن ألعاب الجوال؟', 'أدخل معرّف اللاعب الخاص بك عند الشراء، وستُضاف العملات أو UC إلى ذلك الحساب، لذا تحقّق من المعرّف قبل الدفع.'],
    ['لا يعمل مفتاح أو رمز. ماذا أفعل؟', 'تواصل معنا هاتفيًا أو عبر البريد مع رقم الطلب وصورة للخطأ، وسنتولّى الأمر.']
  ]
};

/* ══════════════════════════════════════════════════════════════════════
   State
   ══════════════════════════════════════════════════════════════════════ */
const pick = () => {
  try {
    const saved = localStorage.getItem('tg.lang');
    if (LANGS.some(l => l.id === saved)) return saved;
  } catch {}
  const nav = (navigator.language || 'en').slice(0, 2);
  return LANGS.some(l => l.id === nav) ? nav : 'en';
};

let activeLang = pick();
const listeners = new Set();

export const lang = () => activeLang;
export const langInfo = () => LANGS.find(l => l.id === activeLang);
export const isRTL = () => langInfo().dir === 'rtl';
export const onLang = fn => listeners.add(fn);

export function applyLang() {
  const info = langInfo();
  document.documentElement.lang = info.id;
  document.documentElement.dir = info.dir;
}

export function setLang(id) {
  if (!LANGS.some(l => l.id === id) || id === activeLang) return;
  activeLang = id;
  try { localStorage.setItem('tg.lang', id); } catch {}
  applyLang();
  listeners.forEach(fn => fn(id));
}

/* ══════════════════════════════════════════════════════════════════════
   Lookups
   ══════════════════════════════════════════════════════════════════════ */
const fill = (s, vars) => vars ? s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : s;

export const t = (key, vars) => fill(STR[activeLang][key] ?? STR.en[key] ?? key, vars);

export function plural(key, n) {
  const forms = PLURAL[activeLang][key] || PLURAL.en[key];
  const rule = new Intl.PluralRules(langInfo().locale).select(n);
  return fill(forms[rule] ?? forms.other, { n: n.toLocaleString('en-US') });
}

/** Prices are whole dinars: "180 DT" in English and French, "180 د.ت" in Arabic. */
export const price = n => {
  // whole dinars as "180 DT"; amounts with millimes (payment fees) as "393.90 DT"
  const opts = Number.isInteger(n) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 3 };
  return activeLang === 'ar'
    ? `${n.toLocaleString('en-US', opts)} د.ت`
    : `${n.toLocaleString(activeLang === 'fr' ? 'fr-FR' : 'en-US', opts)} DT`;
};
/** Plain numbers in the same style as prices (French comma, Latin digits elsewhere). */
export const num = n => n.toLocaleString(activeLang === 'fr' ? 'fr-FR' : 'en-US');

export const date = ts => new Date(ts).toLocaleDateString(langInfo().locale, {
  day: 'numeric', month: 'short', year: 'numeric', numberingSystem: 'latn'
});

/** A tag, spec or badge in the activeLang language (brand names pass through). */
export function word(w) {
  if (activeLang === 'en' || !VOCAB[w]) return w;
  return VOCAB[w][activeLang === 'fr' ? 0 : 1];
}

export function blurb(p) {
  if (BLURB[activeLang]?.[p.id]) return BLURB[activeLang][p.id];
  if (p.blurb) return p.blurb;   // English original
  const kind = TEMPLATE_FOR[p.tags[1]] || 'credit';
  return fill(TEMPLATE[activeLang][kind], { name: p.short });
}

export const faq = () => FAQ[activeLang];
