use USGS EarthExplorer / NASA API  for images

get lattitudes of popular geographical lcocations

ok we will use NASA GIBS API

the proof of concept works 


check the daioly overview project index

https://github.com/limhenry/earthview/blob/master/earthview.json

https://developers.google.com/earth-engine/datasets/tags/satellite-imagery

ok nvm make it client cided and load data dynamically

3/2

make static site, load files lazilly

no hosting costs


https://cdn.jsdelivr.net/gh/limhenry/earthview@master/earthview.json

jsdeliver link

join macondo






I have a few questions regarding macondo

- Can I add a game as a project that i started working on as a game jam project?
- Does the game need to be opensoure? Can't it just be published on itch.io?
- How do streak work? is it per project?
- if i ship a project will my streak multiplier still increase after shipping?
- If i have multiple projects then do i nedd to work on each of them daily to maintain the streak? how long do i need to work on individual projects?
- is time spent making assets and soudtrack for my game counted or not?
- Will fruits be given only after shipping?


---


Devlog #3: Major Progress with actual game Mechanics

Today I managed to actually Generate the grid inside the board with all the tiles of the satellite images.
took a bit of trial and error but it finally renders, Tailwind is also supringly fun to use.

also this little function that converts a tile index into its position [row, colum] tingles my brain in ways i cant express Xd, its simple yet oddly satisfying that i made it myself

The game still lacks Sliding or shuffling mechanics, which is technically the whole pit, but ill reach there soon.

While coding i also got other ideas to implement, so i'll just add them here for the time being as notes

Planned Fatures:-
- 3x3 and 4x4 grid sizes for easy gameplay
- Leaderboard
- Multplayer Support
- Discord Login for game saves



Devlog #4: Minor Trials with Sliding

Got a bit busy with my other project but I did attempt to add the sliding mechanincs today

Im still trying to figure out ways to do it

at first I just added a translate x & Y css to it using JS, then i fugured out you can stack it.
but now I'm seeing issues with it, after multiple moves the images start to get offset.
Also no sliding animation yet

also its weird how there is no direct way to get a div's raw computed height without padding and margins

---

Devlog #5: implemented multi-tile-slide and switched to GASP for animations

Today I probably spent the longest on this project. at this rate idk how slow my progress will be, I keep going back to reworking the same thing multiple times over until it works and looks perfect, I'll have to learn to skip things on occassion

Ok now back to topic, Firstly I am now using GASP for animating the Sliding animation, and I'll state my reasoning for it

first I tried 5 different approaches to animating tile sliding

Pure JS
- Pros: Very simple
- Cons: No sliding animation....

Using Css
- Pros: no need for any other tools
- Cons: HELL!!!!!!!!

Native View Transition API
- Pros: Simple enough and built into browser
- Cons: Cant interact with tiles during animation which broke immersion

Anime.JS
- Pros: Very Powerful and feature rich
- Cons: Overkill for my use case

GASP (in use rn)
- Pros: Simple FLIP extension
- Cons: Idk? not as verbose as animejs? its simple for my use case, I didnt try other features


back to my js logic, it has two main function, `render()` and `moveTile()` and today I spent my entire time working on the second function.
Its a 30 line function that I might have rewritter over a few donzen times, after each itiratin I made it smaller and reduced the numbers of loops and checks

<!-- Image -->

Currently I use a simple logic which first checks if the clicked tile is in the same row/column as the empty tile. Then it creates a list of all tiles between the empty and clicked tile, and moves all tiles together.

<!-- Image -->

tomorrow I'll work on  improving the Render Function, Currently all 24 tiles are destroyed and recreated on each click, thats got to kill performance? right?

---