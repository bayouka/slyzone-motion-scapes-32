# 2b2c — Call Engine V2 — Release Gate

## Problème observé en production

Les deux derniers appels réels ont enregistré 2 participants mais 0 offer, 0 answer et 0 ICE. La cause racine était un droit EXECUTE manquant sur `app_private.can_access_call_v1(uuid)`, fonction utilisée par les RLS des appels.

Le moteur historique reconstruisait aussi régulièrement son DOM vidéo pendant le polling. Cela pouvait provoquer des sauts/flickers caméra et partage d’écran.

## Architecture V2

- `get_call_sync_v2` : snapshot atomique session / participants / invitations / signaux.
- Perfect negotiation WebRTC avec pair polite/impolite.
- ICE queue + ICE restart + recréation de pair après échecs répétés.
- Cloudflare TURN si disponible, STUN fallback explicite.
- Transceivers séparés : audio / caméra / écran.
- Caméra et partage d’écran simultanés.
- Pré-join caméra/micro, caméra frontale mobile par défaut.
- Changement caméra, micro et sortie audio si support navigateur.
- Ajout de participants en cours d’appel, max 6 présents.
- Reprise d’appel et reconnexion après retour réseau.
- `getStats()` pour état réel de la connexion et détection relay/TURN.
- Call Engine chargé avant le runtime historique et propriétaire des actions visio.

## Continuité média

`call-media-continuity-v2.js` empêche les réaffectations `srcObject` lorsque les pistes du flux n’ont pas changé. Les éléments média V2 gardent donc leur flux continu entre deux synchronisations. Le guard est limité aux éléments dont l’id commence par `ce-v2-`.

## Gate avant certification fonctionnelle

La mise en production technique ne suffit pas à valider la visio. La certification fonctionnelle exige :

1. desktop ↔ desktop : audio + caméra bidirectionnels ;
2. desktop ↔ mobile et mobile ↔ desktop ;
3. Wi-Fi ↔ réseau mobile ;
4. partage d’écran visible à distance sans couper la caméra ;
5. caméra avant/arrière sur mobile ;
6. mute/unmute et caméra on/off ;
7. 3 participants ou plus ;
8. ajout d’un participant pendant l’appel ;
9. changement/perte réseau puis reconnexion ;
10. départ/reprise d’un participant ;
11. fin de session propre ;
12. absence de flicker périodique des balises vidéo ;
13. connexion TURN/relay observable lorsqu’un chemin direct n’est pas possible.

Tant que ces tests client-client ne sont pas passés, la visio reste `release candidate`, pas certifiée.
