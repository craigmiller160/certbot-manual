# certbot-renew

Just a helpful program to help with certbot. For full instructions, see the cluster-ingress project.

## Certbot Already Running Error

If so, delete this file:

```
/etc/letsencrypt/.certbot.lock
```

If that doesn't work, kill the process if it exists:

```
sudo ps -ef | grep cert
sudo kill {pid}
```

## NOTE

Currently fails when trying to move certificates to output, likely due to root rights required.