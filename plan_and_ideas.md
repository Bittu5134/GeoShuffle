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

