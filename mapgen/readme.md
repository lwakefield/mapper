# Mapgen

In the style of [Tilekit](https://rxi.itch.io/tilekit).

We have a rudimentary "language" for building maps.

Turn a Map:

```
       
 xxxxxx
 x....x
 xx...x
  x.xxx
  x.x  
  xxx  
       
```

Into a tileset:

```

 ┏━═━═┓
 ┃░▒▒░┃
 ┗┓░▒░║
  ┃▒┏═┛
  ┃▒┃
  ┗━┛

```

With pseudo-randomness.

Our pattern "language" is less flexible than Tilekit's implementation. We use "strings"
 as the data structure. This means that the both the input and pattern datastructures are readable, but makes it harder to define rules like "not a 'w' tile" without breaking that readability.
