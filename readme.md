# DnDandy

DnDandy is a virtual tabletop for D&D with the following features:

- Map Creation
- Realtime Sync
- GM/Player View
- Fog of War
- Unlimited maps per game
- Custom tokens
- Chat
- Dice rolling

DnDandy was built out of a frustration with Roll20. It is not intended to be a feature-for-feature clone, instead it focuses on the core features (map management, token management and chat), aiming for simplicity, flexibility and speed.

![Screenshot](https://user-images.githubusercontent.com/5688923/88478647-0d729800-cf18-11ea-9333-a0257c56cc85.png)

# Setup

There are still some manual steps to get up and running:

1. Install app dependencies - `cd app && yarn`
2. Start the stack - `docker-compose up`
3. Setup the s3 bucket:
3.1. Browse to `localhost:9000`
3.2. Login with credentials found in `docker-compose.yml`
3.3. Add the `user-assets` bucket
3.4. Add a `* read-only` asset for the `user-assets` bucket
4. Add `127.0.0.1 imgproxy` to your /etc/hosts
