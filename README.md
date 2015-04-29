# Friends

### P2P chat powered by the Web

![screenshot](static/screenshot.png)

**Alpha quality** you probably only want to use this if you like to send pull requests
fixing things :)

## How it works

Like Slack, except P2P, secure, and authenticated with real crypto.

If you use Github, you're already logged in when you open the app. It uses your .gitconfig
to find your email and github username. When you send messages, they're signed with your
ssh key. Other users verify that messages are really from you by checking your list of
public keys on Github (example: here are one user's [public
keys](https://api.github.com/users/feross/keys)).

We connect to peers over WebRTC for reliable connectivity across NATs. We also want to
build a browser client so it's easy for users to pop into a channel without installing
anything :-) Using WebRTC means that web peers are just like desktop clients.

What's if there's no Internet connection? We support multicast DNS, also known as Bonjour,
to send messages to anyone on your local network.

What if there's no Wi-Fi router? What if your friend's device isn't on the same network?
We support BlueTooth LE, so you can just send messages / transfer files to anyone
physically near you. (this is still a proof-of-concept, working on it)

We connect over all transports and just use the best one.

All the data for the channels/rooms you've joined is replicated using
[hyperlog](https://www.npmjs.com/package/hyperlog), a merkle DAG that replicates based on
scuttlebutt logs. It's a gossip protocol, so your messages can still reach people you're
not connected to, as long as there's a path through the network to them. You don't need to
be directly connected to someone to talk to them. Messages are "gossiped" around the
network until everyone has received the message.

If a few folks are physically near each other and go offline together, they can continue
to chat over mDNS or BlueTooth LE and their messages will be merged back into the channel
when they reconnect with the rest of the network.

Work in progress, but give it a go if this sounds interesting! :-) Note: It requires a
`git clone` and `npm install` at the moment. Downloadable binaries coming soon.

## Logging in

You need a working git + github configuration

- have a publicly listed github email (e.g. shows up on your github account)
- if you dont wanna do that then do `git config --global user.username yourusername`

When you launch the app it should "just work" now if you have git setup correctly :)

If it doesnt work, do this to get debug information:

```
$ npm i github-current-user -g
$ DEBUG=* github-current-user
```

Note: DSA keys are not supported. You should switch to RSA anyway for security reasons.

If it can't verify you, try doing `ssh-add ~/.ssh/id_rsa`. Your key should show up when you run `ssh-add -l`.

## Building

You'll need the newest io.js and npm (`>= 1.8.1`, `>= 2.8.3`)

* `npm install`
* `npm run rebuild-leveldb` to compile leveldown for electron. you will have to modify the command in package.json if you are non a non 64 bit architecture
* `npm start` to run in electron
* `npm run package` to build distributable.

## Running on a server

We have included a message seeding utility (named "peerbot") that you can run yourself on a server to ensure that there will always be a peer available to connect to for a channel.

- first, follow the build instructions above
- `npm i electron-spawn electron-prebuilt -g`
- `electron-spawn peerbot.js --channel=cats`

it always seeds the `#friends` channel, pass `--channel=mychannel` to also seed another channel. you can specify as many channels as you want with multiple `--channel` flags

If you running it on headless Ubuntu, you will need to use `xvfb-run` to create a virtual display so that Chromium can run:

```
$ sudo apt-get install xvfb
$ xvfb-run electron-spawn peerbot.js
```

Also you [may need to `apt-get install libgconf-2-4`](https://github.com/atom/electron/issues/1518)

## License

[MIT](LICENSE.md)
