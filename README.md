# Pittsburgh Access Map

Requires Node.js 22.13+ with `node:sqlite` support.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. Locations and reviews are stored in `data/app.sqlite`.
Set `DATABASE_PATH` to use a separate database, including for demos.

## Demo locations

Run `npm run db:mock`, then reload the app. This adds three fictional locations
labeled “Demo”, including a cafe with a sample review. Running it again does not
duplicate locations or reviews. These are optional; ordinary startup does not add them.

## Admin login

Create an admin account locally using a new username. There is no default admin password:

```sh
ADMIN_USERNAME=map_admin ADMIN_PASSWORD='<your unique password>' npm run admin:create
```

Use the **Admin login** button in the app. Ordinary signup and guest login cannot
grant admin privileges. Admins can remove community notes from any account;
built-in sample reviews remain read-only. Existing usernames are never promoted
or overwritten by the setup command.

## Reviews and missing locations

Adding the same name within 90 meters opens the saved location so new reviews join
its existing thread. Users may add follow-up reviews without replacing earlier ones.
Failed review submissions retain their draft. Empty city searches show “Location
not found”; missing saved places return HTTP 404 and show a missing-location panel.

## Checks

```sh
npm run test:run
npm run test:api
npm run build
```

On Node 26, disable Node's experimental web storage when running the frontend
suite so jsdom provides browser storage:

```sh
NODE_OPTIONS=--no-experimental-webstorage npm run test:run
```
