# osu!mirror

I wanted to make my own mirror. As there was no open sourced osu! mirror software, I decided to write my own. So there it is, an osu! beatmap download mirror. nodejs masterrace btw.

## setting things up

```
git clone https://github.com/TheHowl/osu-mirror.git
cd osu-mirror
cp config.example.js config.js
nano config.js
npm install
mkdir maps
mkdir maps/elab
mkdir maps/out
mkdir maps/test
node make_db.js
```

## running

```sh
tmux new
node index.js
```

You can then detach the session using CTRL+B - D. (press ctrl+b together, release them and then press D). And you can live your life happily.

## license

MIT license
