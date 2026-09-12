# 4b4c — Call Engine V3 Direct — décision d’architecture

Date : 2026-09-12
Statut : ACTIVE PREVIEW — V2 reste le moteur public par défaut

## Contraintes produit non négociables pendant le pilote

- zéro carte bancaire ;
- zéro nouveau compte ou fournisseur à créer par l’utilisateur ;
- zéro GitHub Actions ;
- aucune intervention utilisateur pour les déploiements ordinaires ;
- Supabase `wexfzhegiewhldkugtow` reste le backend 4b4c ;
- `slyzone-motion-scapes-32` reste la source produit canonique ;
- `bayouka/2b2c/4b4c` reste uniquement le miroir de transport ;
- Worker de production : `4b4c`.

## Réévaluation du problème

Le dernier appel réel V2 avait bien produit offer / answer / ICE. La panne initiale de signalisation avait donc été corrigée. Le défaut média restant venait surtout de la négociation simultanée : les deux navigateurs créaient leurs propres transceivers, ce qui produisait des MIDs supplémentaires et rendait l’identité caméra / écran non déterministe.

L’adoption immédiate d’un SFU résout le problème de montée en charge, mais ajoute une dépendance de provisionnement/billing qui contredit les contraintes du pilote. Pour une petite équipe et des appels principalement 1:1 à 4 participants, cette dépendance n’est pas justifiée avant d’avoir corrigé la cause observable du moteur direct.

## Architecture V3 Direct

Supabase conserve :
- sessions d’appel ;
- invitations ;
- participants ;
- permissions ;
- signalisation offer / answer / ICE ;
- heartbeat et état micro/caméra/écran.

Le navigateur utilise WebRTC direct avec le STUN Cloudflare public :
- `stun:stun.cloudflare.com:3478` ;
- `stun:stun.cloudflare.com:53` en port alternatif.

Aucun service média externe, secret fournisseur ou Worker média n’est nécessaire.

## Négociation déterministe

Pour chaque paire d’utilisateurs, un seul initiateur est élu par ordre stable des UUID utilisateurs. Lui seul peut créer une offre.

L’initiateur réserve exactement trois transceivers dans un ordre stable :
1. audio ;
2. caméra ;
3. écran.

Après création de l’offre, les MIDs réels sont envoyés explicitement dans le payload de signalisation avec leur rôle. Le destinataire ne crée pas ses propres transceivers avant de recevoir l’offre : il réutilise ceux créés par `setRemoteDescription` et leur attache ses pistes locales.

Conséquences :
- pas de glare offer/offer ;
- pas de duplication 0/1/2 puis 3/4/5 ;
- rôle caméra/écran explicite par MID ;
- partage écran indépendant de la caméra.

## Changement de périphérique et partage écran

Caméra, micro et écran utilisent `RTCRtpSender.replaceTrack()` sur des transceivers déjà négociés. Le partage d’écran n’exige donc pas une nouvelle négociation et ne remplace jamais la caméra.

La caméra frontale reste le choix mobile par défaut et le changement avant/arrière réutilise le sender caméra existant.

## Résilience

- ICE queue par epoch ;
- ICE restart uniquement par l’initiateur déterministe ;
- reprise après retour réseau ;
- état utilisateur dérivé de `getStats()` et des octets RTP entrants, pas seulement de `connectionState` ;
- débit caméra réduit quand le nombre de participants augmente.

## Limite connue et assumée

Sans TURN, certains réseaux d’entreprise, certains NAT symétriques ou certaines politiques réseau très restrictives peuvent empêcher une connexion P2P. Cette limite est réelle et doit rester observable dans la certification.

Elle n’autorise pas à ajouter automatiquement un service payant ou demandant une carte. Une future migration SFU/TURN sera une décision produit séparée lorsque le produit aura un modèle de coût accepté ou une infrastructure déjà disponible sans intervention utilisateur.

## Cible pilote

Qualité prioritaire :
- 1:1 ;
- 3 participants ;
- 4 participants.

5–6 participants restent autorisés mais avec adaptation du bitrate ; ils ne constituent pas la cible de capacité à certifier avant le pilote.

## Gate avant bascule par défaut

V3 Direct reste derrière `?callv3=1` / `localStorage['2b2c.call.engine.v3']` tant que les essais réels suivants ne sont pas PASS :

1. desktop ↔ desktop ;
2. desktop ↔ mobile ;
3. Wi-Fi ↔ réseau mobile ;
4. audio et caméra bidirectionnels ;
5. caméra avant/arrière mobile ;
6. partage écran distant visible sans couper la caméra ;
7. mute/unmute et caméra off/on ;
8. 3 participants ;
9. ajout d’un participant en cours d’appel ;
10. reconnexion après perte réseau courte ;
11. fin/reprise d’appel propre ;
12. aucune duplication de transceivers ;
13. rôles audio/camera/screen identiques des deux côtés.

V2 reste le rollback public jusqu’à cette certification.
