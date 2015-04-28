# Friends

p2p chat powered by the web. **alpha quality** you probably only want to use this if you like to send pull requests fixing things :)

[![travis][travis-image]][travis-url]

[travis-image]: https://img.shields.io/travis/moose-team/friends.svg?style=flat
[travis-url]: https://travis-ci.org/moose-team/friends

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

We have included a message seeding utility that you can run yourself on a server to ensure that there will always be a peer available to connect to for a channel.

- clone this repo, cd into this directory
- `npm install`
- `npm i wrtc`
- `npm link`

then run `friends` to seed just the `#friends` channel (default), or `friends --channel=mychannel` to also seed a custom channel. you can specify as many channels as you want with multiple `--channel` flags

## License

[CC-0](LICENSE.md)
