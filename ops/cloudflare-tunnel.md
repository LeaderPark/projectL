# Cloudflare Tunnel Notes

## What is already prepared

- The project includes an optional `cloudflared` service in `compose.yaml`
- The service is disabled by default and only starts when the `cloudflare` profile is used
- The public website and Riot callback endpoint are both served by the `bot` container on port `8000`

## Cloudflare dashboard setup

1. Sign in to Cloudflare Zero Trust
2. Go to `Networks -> Tunnels`
3. Open the tunnel for this project
4. Add or confirm a public hostname with these values:
   - Hostname: `lol.leaderpark.net`
   - Service type: `HTTP`
   - URL: `http://bot:8000`

## Local runtime values

Set these values in `C:\projectL\.env`:

- `WEB_PORT=8000`
- `WEB_PUBLIC_PORT=8000`
- `CF_PUBLIC_HOSTNAME=lol.leaderpark.net`
- `CF_TUNNEL_TOKEN=<your tunnel token>`

## Start the tunnel

```powershell
Set-Location C:\projectL
.\scripts\start-cloudflare-tunnel.ps1
```

## Expected access paths

- Local: `http://localhost:8000/`
- Public: `https://lol.leaderpark.net/`
