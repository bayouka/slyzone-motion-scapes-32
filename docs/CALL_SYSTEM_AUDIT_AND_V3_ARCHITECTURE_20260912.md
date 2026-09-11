# 2b2c — Audit visio de bout en bout & architecture V3

Date: 2026-09-12
Statut: AUDIT — aucune modification runtime/prod dans ce document
Base auditée: `main@12314f3764a27d72d69837fe601e75fe1e1f82cc`
Prod observée: `v4.5.12-v6-polish-p2 / build 522 / Call Engine 2.0.0`

## 1. Verdict

La couche visio actuelle ne doit plus recevoir de correctifs ponctuels. Elle combine une architecture média P2P maillée, plusieurs owners frontend historiques, une signalisation persistée dans Supabase et un fallback STUN sans relais TURN actif. L'appel peut atteindre l'état WebRTC `connected` sans que les médias caméra/écran soient correctement routés ou décodés.

La cible V3 doit séparer strictement:
- Supabase = identité, présence métier, invitations, autorisations, historique minimal d'appel;
- Cloudflare Realtime SFU = transport audio/vidéo/écran;
- Call Engine V3 = état client, périphériques, rendu, publication/abonnement des tracks et observabilité;
- UI Call = vue pure, sans logique de signalisation propriétaire.

La prod V2 reste disponible uniquement comme version courante; aucun nouveau patch V2 ne doit être ajouté sauf correctif sécurité critique.

## 2. Preuves issues du dernier appel réel

Le dernier appel observé contient bien deux participants et une signalisation offer/answer/ICE. La panne initiale `0 offer / 0 answer / 0 ICE` a donc été corrigée.

En revanche, la négociation V2 dérive:
- négociation initiale: mids `0/1/2` = audio + caméra + écran;
- quelques instants plus tard: mids `0/1/2/3/4/5`;
- les premiers mids deviennent essentiellement `recvonly` et les seconds `sendonly`;
- les deux navigateurs ont donc créé chacun leurs propres transceivers avant résolution du glare.

Conséquence: `peer.cameraTx` / `peer.screenTx` ne désignent plus nécessairement les transceivers sur lesquels arrivent les tracks distants. L'écran partagé peut arriver sur un canal traité comme caméra, et une caméra distante peut ne pas être affichée dans le bon tile.

Les candidats ICE du dernier appel étaient `host` et `srflx`; aucun candidat `relay` n'a été observé. Le bandeau prod « Relais TURN indisponible » est donc factuel.

## 3. Défauts d'architecture V2

### 3.1 P2P mesh inadapté au produit
Pour N participants, chaque client doit maintenir N-1 PeerConnections et republier ses médias vers chaque pair. À 6 personnes cela signifie 5 liaisons sortantes par utilisateur, avant même le partage d'écran. C'est mauvais pour CPU, batterie et upload mobile.

### 3.2 Glare / transceivers non déterministes
Les deux côtés créent audio + caméra + écran puis peuvent offrir simultanément. La stratégie `perfect negotiation` actuelle ne suffit pas à empêcher la duplication de transceivers dans ce modèle. Les preuves SDP montrent cette duplication en production.

### 3.3 Identité des médias implicite
Le code déduit camera vs screen depuis l'objet `RTCRtpTransceiver`. Après duplication/glare cette identité n'est plus fiable. Un média doit porter un rôle explicite et stable (`audio`, `camera`, `screen`).

### 3.4 Faux état « Connecté »
L'UI se base principalement sur `connectionState`/candidate pair. Une PeerConnection peut être connectée avec zéro frame vidéo décodée. L'état utilisateur doit dépendre aussi des RTP stats et des tracks attendus.

### 3.5 TURN non opérationnel
`call-ice-v1` retourne STUN si `CLOUDFLARE_TURN_KEY_ID` / `CLOUDFLARE_TURN_API_TOKEN` sont absents ou invalides. La prod est actuellement dans ce fallback. La connexion desktop↔mobile sur réseaux restrictifs ne peut donc pas être garantie.

### 3.6 Trop d'owners visio
La fonctionnalité est actuellement répartie entre logique historique dans `live.js`, `call-incoming-v2.js`, `call-engine-v2.js`, `call-media-continuity-v2.js`, CSS legacy/V2, Edge Function ICE et RPC Supabase. Cette superposition augmente les courses, rend le diagnostic difficile et complique le rollback.

### 3.7 Monkey patch média à supprimer
`call-media-continuity-v2.js` modifie le setter global `HTMLMediaElement.prototype.srcObject`. Même limité aux IDs V2, ce mécanisme ne doit pas être nécessaire dans une architecture saine. Les éléments `<video>` doivent rester montés et leur stream ne doit changer que lorsqu'un track change réellement.

## 4. Architecture cible V3 — SFU

### 4.1 Média
Utiliser Cloudflare Realtime SFU.
Chaque navigateur maintient une seule PeerConnection avec l'edge Cloudflare.
Chaque participant publie au maximum:
- 1 track audio;
- 1 track caméra;
- 1 track écran facultatif.

Les autres participants s'abonnent aux track IDs autorisés. Un partage d'écran n'est jamais un remplacement de caméra.

### 4.2 Présence et permissions
Conserver Supabase pour:
- `call_sessions`;
- `call_invites`;
- `call_participants`;
- droits workspace/project/meeting;
- état ringing/accepted/declined/left/ended.

Créer une table média dédiée, par exemple `call_media_tracks`:
- call_session_id;
- user_id;
- provider_session_id;
- provider_track_id;
- role = audio|camera|screen;
- state = publishing|live|ended;
- created_at / ended_at.

`call_signals` n'est plus utilisé par V3 pour SDP/ICE client↔client.

### 4.3 Backend média
Le secret Cloudflare Realtime ne doit jamais atteindre le navigateur.
Créer un endpoint serveur authentifié (Worker ou Edge Function) qui:
- crée la session SFU;
- transmet l'offre locale à Cloudflare;
- publie/ferme les tracks;
- autorise l'abonnement uniquement aux tracks du même appel;
- effectue les renégociations requises par l'API SFU.

### 4.4 State machine client
Une seule machine d'état:
`IDLE -> RINGING/PREJOIN -> CONNECTING -> CONNECTED -> RECONNECTING -> ENDED`

Sous-états média indépendants:
- mic on/off;
- camera on/off/switching;
- screen off/starting/on/stopping;
- network healthy/degraded/reconnecting;
- remote track pending/live/stalled.

### 4.5 Rendu stable
Interdiction de recréer les `<video>` pendant un appel pour une simple mise à jour de statut.
Chaque tile est keyed par `userId + role`.
Le DOM média est créé/détruit uniquement lors d'un vrai ajout/retrait de track.

### 4.6 UX
1:1:
- participant distant = scène principale;
- self-view = petit PIP déplaçable ou tile secondaire;
- si écran partagé: écran distant = scène principale, caméras = filmstrip.

Partageur:
- ne pas afficher son propre écran en immense scène par défaut;
- montrer un aperçu compact + état « Vous partagez votre écran » + bouton Arrêter;
- bouton permettant d'ouvrir l'aperçu si souhaité.

Groupe:
- grille jusqu'à 6 caméras;
- écran partagé prioritaire;
- filmstrip horizontal des participants;
- invitations en attente visibles mais séparées des participants connectés.

Mobile:
- caméra frontale par défaut;
- changement avant/arrière;
- contrôles safe-area;
- grille/focus responsive;
- partage d'écran masqué avec explication si `getDisplayMedia` non supporté.

## 5. Santé média et observabilité

Ne plus afficher « Connecté » sur le seul `connectionState`.
Calculer un état utilisateur à partir de:
- ICE/DTLS connecté;
- outbound RTP bytes/frames pour les tracks publiés;
- inbound RTP bytes/frames pour les tracks distants attendus;
- RTT;
- packet loss;
- jitter;
- framesDecoded / framesDropped;
- freezeCount si disponible;
- track muted/ended.

États UI:
- Connexion…
- Connecté
- Média en attente
- Connexion dégradée
- Reconnexion…
- Média interrompu

Ajouter une télémétrie technique courte rétention, sans contenu média ni SDP complet:
- call_id/user_id/browser/platform;
- provider/session;
- state transitions;
- candidate/transport type;
- RTT/loss/jitter/bitrate;
- frames sent/received/decoded;
- track role + error code.

Objectif: diagnostiquer un écran noir depuis les traces sans demander à l'utilisateur de décrire chaque symptôme.

## 6. TURN / réseau

La V3 ne doit pas dépendre d'un P2P direct entre utilisateurs.
Cloudflare Realtime SFU devient le point média. TURN reste nécessaire pour certains clients incapables de joindre directement le SFU à travers NAT/firewall; le service Realtime TURN est adapté à cette fonction.

Le warning TURN doit devenir une vraie information de diagnostic, pas un bandeau permanent de l'appel.

## 7. Contrat qualité avant prod V3

Aucune bascule par défaut avant PASS de toute la matrice suivante:

### Navigateurs/appareils
- Firefox desktop ↔ Chrome desktop;
- Chrome/Edge desktop ↔ Android Chrome;
- desktop ↔ iOS Safari si disponible;
- deux réseaux différents Wi-Fi ↔ 4G/5G.

### Média
- audio bidirectionnel;
- caméra bidirectionnelle;
- caméra off/on;
- mute/unmute;
- changement caméra mobile;
- changement caméra/micro desktop;
- partage écran vu à distance;
- caméra maintenue pendant partage;
- arrêt/reprise du partage sans nouvel appel;
- écran complet non cropé en mode fit.

### Groupe
- 3 participants;
- ajout participant pendant appel;
- départ d'un participant;
- 6 participants avec dégradation acceptable.

### Résilience
- refresh/rejoin;
- background/foreground mobile;
- orientation mobile;
- perte réseau courte;
- Wi-Fi -> cellulaire;
- permission caméra refusée;
- permission micro refusée;
- périphérique caméra retiré.

### Assertions techniques
- une seule PeerConnection client↔SFU;
- aucun SDP client↔client;
- aucun double owner d'action d'appel;
- aucun monkey patch de `srcObject`;
- zéro recréation cyclique des tags `<video>`;
- chaque track a un rôle explicite;
- `Connected` impossible si les stats média attendues restent à zéro au-delà du délai défini.

## 8. Migration

1. Geler V2, hors sécurité critique.
2. Provisionner Realtime SFU dans l'environnement Cloudflare existant, sans GitHub Actions.
3. Créer backend V3 sécurisé.
4. Ajouter schéma `call_media_tracks` + télémétrie minimale.
5. Construire Call Engine V3 derrière un flag interne.
6. Tester V3 sans remplacer V2 en prod.
7. Exécuter la matrice réelle desktop/mobile/cross-browser.
8. Basculer V3 par défaut uniquement après PASS.
9. Retirer V1/V2 et `call_signals` média après période de stabilité.

## 9. Décision recommandée

Ne pas poursuivre l'architecture P2P mesh actuelle.
Adopter Cloudflare Realtime SFU pour la V3: cohérent avec la stack Cloudflare existante, mieux adapté à 2-6 participants, au mobile et au partage d'écran, et permettant d'identifier explicitement les tracks au lieu de déduire leur rôle depuis des transceivers fragiles.
