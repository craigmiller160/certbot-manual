# certbot-renew

Just a helpful program to help with certbot. This needs to be run on the machine with the Kubernetes cluster on it.

## How to Setup

### Setup Directory

Need a directory that NodeJS can write to for the automated script to work. Create the following directory and symlink it.

```
mkdir ~/authcode
sudo ln -s /home/craig/authcode /opt/kubernetes/data/ingress/authcode
```

Keep in mind if you change this at all while the ingress is running, it needs to be restarted.

### Setup Certbot

Certbot is a terminal application provided by Let's Encrypt. It can be installed on the Ubuntu-derived version of Linux using snap:

```
sudo snap install --classic certbot
```

Then, you need to register with certbot before anything else:

```
sudo certbot register
```

## How to Run

Simply run `yarn start` in this directory and then sit back and wait. Do not push any keys, the script should do everything.

## Post-Run Tasks

Restart the `cluster-ingress` with `kubectl rollout restart deployment cluster-ingress`.

Then, Nexus needs to be manually updated with the certs. The p12 password should be `password`.

```
sudo cp /opt/kubernetes/data/ingress/cert/privkey.pem /opt/kubernetes/data/nexus/data/etc/ssl
sudo cp /opt/kubernetes/data/ingress/cert/fullchain.pem /opt/kubernetes/data/nexus/data/etc/ssl
sudo openssl pkcs12 -export -out /opt/kubernetes/data/nexus/data/etc/ssl/nexus.p12 -inkey /opt/kubernetes/data/nexus/data/etc/ssl/privkey.pem -in /opt/kubernetes/data/nexus/data/etc/ssl/fullchain.pem
sudo chown 200 /opt/kubernetes/data/nexus/data/etc/ssl/*
sudo chmod 755 /opt/kubernetes/data/nexus/data/etc/ssl/*

kubectl rollout restart deployment nexus
```

## Use Certbot Manually

This is how to directly use certbot without the script to generate the certs. Use this if there is a problem with the script.

```
sudo certbot certonly --manual
```

This will first ask for the domain name `craigmiller160.ddns.net`. Then, it'll offer a long, encoded string that has to be placed on the server and returned at the endpoint `/.well-known/acme-challenge/########`.

Then, put the authcode into the authcode file at `/opt/kubernetes/data/ingress/authcode/authcode.txt`. This will automatically expose it via the ingress API.

Please validate that you get the code back from the endpoint, as you only get 5 tries per-hour.

Once it is deployed and ready, click "enter" to proceed. Let's Encrypt will validate the code, and then issue the certificates in these directories on your machine:

```
# Certificate
/etc/letsencrypt/live/craigmiller160.ddns.net/fullchain.pem
# Key
/etc/letsencrypt/live/craigmiller160.ddns.net/privkey.pem
```

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