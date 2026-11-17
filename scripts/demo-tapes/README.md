# Demo tapes

[VHS](https://github.com/charmbracelet/vhs) scripts for the terminal demos in `public/demos/`.
Each tape expects the project repo cloned and set up under `~/work/` (see the `cd` line in its hidden setup block).

```sh
vhs jev.tape      # -> jev.mp4, copy to public/demos/jev-support-desk/demo.mp4
vhs utdlang.tape  # -> utdlang.mp4, copy to public/demos/utdlang/demo.mp4
```

`public/demos/moneyplant/` is a production build of the TAMUhack React frontend
(`PUBLIC_URL=/demos/moneyplant npm run build`, BrowserRouter `basename`, media re-encoded smaller).
