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

Devlog #8: Worked on Leaderboard, Primitive Settings, Scores and Timings

This is going to be a quick follow-up of the last devlog. 

Here is what I have achieved since last time

- Scores ✅
- Local Leaderboard ✅
- Global Leaderboard
- Discord login for Leaderboard (or some other way)
- Multiplayer
- settings ✅ (somewhat working)
- Build a P2P solution
- SHow real life location

<!-- IMAGE OF SCORES -->

ok so firstly I removed the old `Moves`/`Best Moves` from the top and instead set it to track `Moves`/`Time Taken`.
Cause I found that new users will take more time on average to finish a puzzle while pros who can easily finish the puzzle would rather like to compete with time, So I figured players should be allowed to track both

<!-- IMAGE OF LEADERBOARD -->

I also started work on a leaderboard that would show both `time spent` and `moves made` to finish a puzzle.
I decided to use `Time Spent` as the default sorting order. (Mojority of the people dont care about moves 🥀)

There is going to be a local leaderboard and a global leaderboad, and as the name implies one will contain scores from all the players and the other will only show your scores. (in the curent version the gloable leaderboard does not function)

<!-- IMAGE OF SETTINGS UI -->

I also started using a Modal based Settings popup, these fit the style of the site imo, also im using the DaisyUI Componets for TailwindCSS to make these modals, the settings menu is simple rn, but I do plan to add more fetures in it.

<!-- IMAGE OF FULL UI -->

ALso as you might have noticed from the previous screenshots the UI has the been changed, I fully leaned into the Tailwind Ecosystem and I made a Custom DaisyUI theme to use on the site, Actually Two Themes, A light and a dark one.

Ofcours the current theme is placeholder, I still want to tweak it to fit my original inpiration for the website theme ([The Chobani Cups](https://www.google.com/search?sxsrf=ANbL-n6m_n5Y6JSG3Z9JCBRCU4Ol5Q44ow:1781802092991&udm=2&q=chobani+yogurt))

With all that being said, I still need to implement lots of other features like sounds and multiplayer, which will take time.
I am somewhat obsessed with distributed systems and so I wanna make the multiplayer version peer to peer and decentralised.
ok thats enough for today, more in the next journel! (Is this how journelling is done? idk im just saying whatever I want)

---

