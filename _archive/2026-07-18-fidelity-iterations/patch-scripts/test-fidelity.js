// test-fidelity.js
// Local sanity check — run BEFORE wiring anything into server.js.
//
// Usage:
//   ANTHROPIC_API_KEY=sk-ant-... node test-fidelity.js
//
// Paste in a real manuscript excerpt and its FluidScriptr-generated
// screenplay conversion below, then check whether the omission
// classifications and dialogue categories look right to you. Run it 2-3
// times on the same pair — the extraction should be roughly stable even
// if exact wording varies. If the omission classifications or dialogue
// categories swing wildly between runs, tighten the prompt (e.g. add a
// worked example) before moving to scoring.js.

const { buildStructuralAndOmissionPrompt, buildDialoguePrompt } = require("./prompts");
const { computeFidelityScores } = require("./scoring");

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// Pulls the JSON object out of a response even if Claude added a stray
// sentence of commentary before or after it (which it sometimes does
// despite being told not to). Finds the first "{" and the matching last
// "}" and parses just that slice.
function extractJSON(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in response:\n" + text);
  }
  const slice = text.slice(start, end + 1);
  return JSON.parse(slice);
}

async function callClaude(system, user) {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await res.json();

  if (data.error) {
    throw new Error("Anthropic API error: " + JSON.stringify(data.error));
  }

  if (data.stop_reason === "max_tokens") {
    throw new Error(
      "Response got cut off before finishing (hit the max_tokens limit). " +
      "Try a shorter manuscript/screenplay excerpt for this test, or raise " +
      "max_tokens further in this file."
    );
  }

  const text = data.content?.map((b) => b.text || "").join("") || "";
  return extractJSON(text);
}

async function main() {
  const manuscriptText = `Choosing Grace



A Novel







Steve Walker
                                         
                                         Imagination
is a terrible thing: you will need
to love it, I will teach
my son or daughter.

Thomas Lux, Sailing, Islands



MARGE: 	When there’s a missing element that stops us from being able to 
judge something, and this fact becomes unbearable, the only
thing we can do is decide.  To overcome doubt, we sometimes
have to decide to opt for one side rather than the other.  Since
you need to believe in one thing, and there are two…you are 
going to have to choose.  
DANIEL:	So you have to invent your belief?  
MARGE:    	Yes, well… in a sense.
DANIEL:	So that means, I’m not sure…and you’re saying I have to
pretend I’m sure?
MARGE: 	No, I’m saying decide.  That’s different.
		
from Anatomy of a Fall, a film by Justine Triet and Arthur Harari


 

Contents


	
Hemingway										3
Last Wishes										18
Crime Scene										35
The Last Time I Saw Aaron							55
Snapshots I										22
Searching for Answers								61
Sarah											72
The First Man He Trusted							84
Searching for Answers – Coda							94
Snapshots II										103
The “Circumstances”								120
Choosing Grace									
Latham, AL:  Prelude								
Latham, AL										
Rowan Oak										
Appalachian Rain									
Return to New York								
The Price We Pay for Love							
Interlude:  Space Baby								
Where Does This Leave Us?							
Sometimes There’s No “Why”	
Last Supper										
Mrs. Laidlaw									
A Fox, Pausing in Snow								
Dr. Darmstaedter									
Metanoia										
Snapshots III										
The Clearing									
Washing the Dead									
Celebration of Life									
Lunchbox										
What Remains of Us




	When Shoshanna, Aaron’s literary agent ex-girlfriend – you’ll meet her later – proposed that I write this book, I demurred.  First, I told her, I write clearly but not well.  Second, I doubted that the story she wanted me to tell – my best friend Aaron killed himself and I tried to understand why – would be of much interest to anyone else.  Third, it would require me to share personal details of my and others’ lives, which I was loathe to do.      
	I’ve thought a lot about why I finally said yes.  
Joan Didion memorably observed that “we tell ourselves stories in order to live.”  Her point, I think, is that the impulse to impose order on what otherwise would be chaotic unmediated experience is basic human nature.  After all, what is “memory,” fundamentally, but the mind’s deployment of narrative technique to (re)organize personal history into stories?  This process requires the development of a coherent “plot”; you have to determine:  X happened because of Y, which in turn caused Z.  People must be defined into characters.  There also has to be a narrator, which requires a point of view.  Judgments have to be made.  
But stories aren’t stories until they’re told.  They require an audience, even if it’s imaginary, or comprised of only one person.       
Having a witness is as important as making the story. 
I wrote this book, this account of my friendship with Aaron and, as Shoshanna would say, the “grief journey” I undertook to make sense of his suicide and metabolize his loss, because telling you the story is what makes it real.













Hemingway

It began, as was so often the case at American liberal arts colleges in the 1980s – and Reed was no exception – with a Derrida reference.  You remember how it was:  you’d be talking about a book you liked only to have some moron spoil the conversation by asserting, as though it were self-evident, that the semiotic ambiguities inherent in language prevent meaning.  This would be followed by an interminable lecture on signs and the signified.  To be fair, the problem here may be my lack of patience with, or perhaps capacity for, extended abstract thought.  Nonetheless, the proposition that “theory,” the analytical subordination of human experience to intellectual constructs imported from France, should mediate the understanding of literature, and especially our literature, has always struck me as irresponsible.  
This says something about me.  It’s important, knowing who’s telling the story.
That day – I’m recounting how Aaron and I became friends during our first year of college – our small seminar, American Fiction Between the Wars, was discussing the famous opening paragraphs of A Farewell to Arms that are so often cited as the exemplar of Hemingway’s style.  What were the literary choices of this narrative opening and what were they trying to accomplish?  the professor had asked us.  Was there a relationship between form and content?  
Bronwyn Klein had an opinion.  
Bronwyn always had an opinion.  This was one of the best things about her.  She was lovely.  She was insufferable.  When she wasn’t recounting the latest howler committed by her haplessly bourgeois parents or rolling her eyes at the questionable life choices of friends she had known at Spence, she was with the pride that comes with ownership extolling the many virtues of New York City, which one was given to understand and accept without question as The Center of the Universe.  We dated for a while in college.  I continue to adore Bronwyn, who is a lawyer and CEO of Fast Forward, a women’s advocacy group in Washington, DC, a city she loathes.  
But I’m getting ahead of the story.
Back to 1980.  We are seated around a conference table in a small, overheated classroom in Eliot Hall, one of the college’s original ivy-covered brick buildings.  Fall, a season I have not yet experienced yet – I was born and raised in Hawaii and had only been to the mainland once, to California, in the summer, when I was eight – is just beginning.  It’s mid-afternoon, but darker this week than last.  Rain is tapping the early 1900’s leaded windows.  We’ve taken off our coats and sweaters.  I still associate autumn with the smell of wet wool.    
Bronwyn observed that a sense of masculine woundedness, communicated by the sparseness of the language – the short sentences, the absence of metaphors – permeated this and Hemingway’s other novels and, especially, the Nick Adams stories.  She conceded that there was a certain “music” to the prose, but was not sympathetic to it.  “Poor me”, she whined.  “I’m a man and can’t express my emotions.  Give me a break.”  
This drew a laugh.
Note, as I certainly did, how Bronwyn took it for granted that we had all widely read Hemingway.  Prior to this class, The Old Man and the Sea was it for me.
Graham Gumm, a second-year Poli-Sci major who was trying to impress Bronwyn, agreed.  It was he who invoked Derrida, whom at that point I’d never heard of.  Referring to the novel as the text, Graham posited that the point of Hemingway’s style was to demonstrate the futility of language, the inability of words to convey “stable” meaning.  He argued that this poses an existential problem for a writer:  how to reconcile the overwhelming need to communicate a vision with the inability of words to accomplish this.  This dilemma, he concluded, was a metaphor for the despair of the traumatized Lost Generation.  
	I felt much but said nothing.  This was three weeks into the fall semester of my freshman year.  It would be another month before I turned eighteen.  I simply didn’t have the words.  That this reflected, in part, a difference of class seems obvious in retrospect, but class was a sensitive subject at Reed, by which I mean that my peers were embarrassed by their affluence and sought to disown their shame through radical politics, dressing like poor people, and other performative adolescent beaux gestes that were belied by their assumptions about the world.  The fact was that most – not all, but most – of my classmates were like Bronwyn:  they knew what Martha’s Vineyard was.  
I was from a different island, the Big Island of Hawaii.  My hometown, Kailua-Kona, was in the seventies when I grew up culturally as well as geographically distant from the places where the kind of people who read the Sunday New York Times lived.  During those first weeks of college, I was acutely aware that I was intellectually outmatched and socially unprepared, and that it was only a matter of time before everyone else figured this out. 
	(True story:  Bronwyn was confused once when I described flying east to California en route to Reed.  She thought Hawaii was directly south of the United States, somewhere impossibly in the Gulf of Mexico, because that’s where it appears so often in inset maps.)
Reed was, in so many ways, another country.
(I remember paging through a New Yorker with Bronwyn one Sunday afternoon.  I wasn’t getting the cartoons, which of course she found hilarious.  “But dogs don’t talk,” I protested.  She looked at me.  The penny slowly dropped.  “You’ve never been skating on Wollman Rink,” she said flatly, the extent of the horror becoming manifest.  “You’ve never seen a Broadway show.  You’ve never been to MoMA.  You’ve never had a slice.”  She, to whom silence did not come naturally, contemplated me, as if I were another species.  I suppose I was.)
The ancient radiator clunked; the light outside changed.  Nancy Chen remarked on the narrative centrality of the “distinctive authorial voice” in this novel, something we had also seen in Nightwood, which we had read and discussed the previous week.  I liked Nancy but my frustration was growing.  It wasn’t that my classmates were wrong.  In fact, I was intrigued by Bronwyn’s observation about the dearth of metaphors in Hemingway.  It was that they were missing the point, something fundamental I could not articulate.
Then Aaron spoke up.
“It’s not what the language means or doesn’t mean,” he said.  “It’s the language itself.”
Bronwyn looked skeptical.  Graham had the sour look sophomores have when they are challenged by freshmen.  
Aaron tapped the cover of his book.  I can still hear that thump.  
“It’s what the sentences do,” he insisted.  “The specificity of” – he’s finding the page – “the pebbles and the riverbed and the leaves on the trees that fell late this year and the troops marching along the roads” – he looks up – “creates a silence – not a ‘representation’ of silence, an actual silence – that allows us, as readers, to hear more clearly all the things that, as a result, no longer need to be said.”  He had been speaking with urgency.       
“That’s interesting,” the professor said, pleased we were on the right track.  “So right from the beginning we are presented with a very distinct ‘authorial voice’ and a very distinct style,” he continued, tying together Nancy and Aaron’s points.  “Let’s look at how these reinforce each other.  Hemingway has built us a house.  Let’s figure out its architecture.”
Graham looked downright pissed.  The professor, apparently, thought words did in fact matter in fiction.  This was not the first time Graham had tried, and failed, to assert his brilliance.  During our discussion of The Sound and the Fury, for example, he deployed both intertextuality and hermeneutics.  Aaron, interested like the others in where our professor was taking us, was oblivious to Graham’s irritation, which, I could see, only made it worse.   
I wanted to grab and hug him.   
After class, Aaron and I had coffee.  
The campus coffeeshop’s ancient jukebox was playing Diamonds and Rust.  I congratulated Aaron on his triumph.  He laughed, claiming to have not been aware of the underlying drama.  We talked about Hemingway.  We shared recent literary discoveries (for me, Annie Dillard; for Aaron, Wallace Stevens).  We agreed that Bronwyn was formidable.  He asked what I thought about Nancy, whom he found attractive.  We were each pleased the other was also considering joining the rugby team, a sport neither of us had played or understood.
The hour passed quickly.  I had another class.
“Thanks for suggesting coffee,” Aaron said.  “I was a bit surprised, to tell the truth.” 
“Why’s that?” I asked.
“Well, you’re a big guy and a bit intimidating.  You don’t say much, but when you do, it’s really interesting.  I just figured you were super smart and didn’t like the rest of us.”
I laughed at the absurdity of the idea that my imposter syndrome could be mistaken for arrogant confidence.  The stories we tell ourselves more often than not have an unreliable narrator.  
“No, not at all.  To tell the truth, I think they made a mistake when they accepted me.  Everyone is so much more…advanced than I am.”   
“I feel the same thing!” he exclaimed, grabbing my forearm.  He was excited:  I had articulated and thus validated what heretofore had only been a vague but powerful feeling.  “I feel like this fucking hick from Alabama.  Which I kind of am, but still.  I have nothing in common with these people.”
Aaron and I were best friends for many years.  
And then we weren’t.  
There was no dramatic falling out, no messy divorce.  Our lives took different paths, we got busy.  I don’t know.  

                                         *     *     *

Late last July I received an envelope with an embossed Midtown Manhattan return address.  The timing here was fortuitous:  a week earlier, I had finished a rewarding but exhausting assignment at the State Department and was now on leave for a few weeks, looking forward to an academic year at the National War College, the Department of Defense’s graduate-level senior officer professional education program that includes billets for colonel-level diplomats.  I opened the envelope warily.  Letters from lawyers make me nervous.  
Jared Ellison of Bradford, Lindstrom & Tsai, LLC was writing to inform me that I had been named as the Executor of the Estate of Aaron Sullivan.  
Aaron, whom I hadn’t seen or spoken to in almost two years, I was given to understand by this neatly typed communication on quality legal bond, was dead.  
I thought about that.
Aaron standing beside me at my wedding.  Aaron, Nate, Jean-Luc, and I getting high at Bagby Hot Springs.  Aaron holding my newborn son:  “Now this…this is something.”  Aaron calling me the day Sarah left him.  
Acknowledging that “this may be a complex and emotional process,” Jared Ellison reassured that he was here to assist me in fulfilling my executorial duties.  His firm was prepared to guide me though each step.  He looked forward to working with me to ensure that Mr. Sullivan’s wishes were carried in accordance with the terms of the will and applicable law.

                                         *     *     *

I am somewhere on I-81, driving alone in southern Virgina in the quickly gathering darkness of a mid-October late afternoon.  I am listening to Neil Young’s Live Rust.  My destination is Fairfield, Alabama, just outside Birmingham, where, consistent with and in fulfillment of Aaron’s final wishes, I will tell his father, in person, that his son is presumed dead.
I say “presumed” because Aaron’s body was never found.  Two tourists from Germany hiking in the Adirondacks near OK Slip Falls found a neatly folded pile of men’s clothes in a clearing overlooking the Hudson.  Placed next to it was a pair of hiking boots, socks tucked inside the right shoe, and a phone, watch, a St. Jerome medal, and Bradford, Lindstrom & Tsai’s business card in the left.  
The Germans, seeing no one around and aware of the implication of the scenic 215-foot drop, grew concerned and alerted the police.  The search yielded nothing.  (The Adirondacks Park Authority ranger who participated in the search confided to me a few weeks later that they hadn’t expected it to:  “There’s just too much damn river.”)  There was no evidence of foul play.  The Hamilton County coroner determined Aaron’s death a suicide.
It's night now.  Road, trees, the beam of my headlights.  A barn owl just swooped down over the highway, hunting, its raptorial eyes flashing.
You can’t be twenty on Sugar Mountain, Neil is singing in his doleful high tenor, though you’re thinking that you’re leaving there too soon.
I remember Aaron alternatively crying and laughing during his best man’s toast at our wedding.
There was the day he told me – this was at Reed – that Maura Sinclair had blown him in the shower an hour earlier.
I recall Aaron patiently listening to my six-year-old son Sam explain the differences between a Tyrannosaurus rex and a Stegosaurus, the former carnivorous with a lizard-like pubis that pointed forward, the latter primarily herbivorous with a bird-like pubis that pointed backwards.   
“What’s your favorite dinosaur?” he asked when Sam had concluded his lecture.
My son thought carefully then responded, “the Velociraptor.”
“Ah, that’s a good one,” said Aaron, as if he knew what a Velociraptor was.
“What’s your favorite?” 
Aaron reflected for a while then, straight-faced, replied, “Barney,” in response to which Sam theatrically fell to the floor, moaned as if he’d been mortally wounded, and held his little hands over his eyes.
I remember Aaron declaring Jean-Luc an asshole – and an asshole of the worst kind:  French-American and raised in Switzerland – for not recognizing the genius of Miles Davis’s Bitches Brew.  To which Jean-Luc replied, bowing to each of us in turn, “Fuck you, vaffanculo, and va te faire foutre.”  
He loved to hike.  Actually, that’s a bit misleading.  It wasn’t hiking Aaron loved as it much as it was thinking (if alone) or talking about what he was thinking (if I or others were with him).  I remember us hiking together, enjoying how the sustained vigilance of having to be careful of rocks and branches distracted our here-and-now brains, freeing our creative minds, stimulated by natural beauty, to wander.  
Bronwyn wondered once how two people as different as Aaron and I could be close friends.  It’s a good question.  I try to articulate an answer as I negotiate the gentle curves of the winding highway.  Not much time passes before I give up.  We were tuned to the same frequency, is the best I can do.

                                         *     *     *

Our origin story, I’m proud to say, was part of the inspiration for “I’ll Have What He’s Having”, our friend Nate O’Brien’s essay in Wired that introduced brogasm into the national lexicon.  
In late ’97 or early ’98 Nate flew in from San Francisco to do meetings on the Hill for a story he was writing on Congress’s regulatory approach, or lack thereof, in the then-at-full-fizz market effervescence that was to become known as the dot-com bubble.  To his credit, Nate was one of the prescient observers who warned early on that what goes up inevitably comes down.  I had joined the Foreign Service and after tours to Turkey and Mauritania was back in Washington studying Arabic for my third assignment to Yemen.  We were having lunch at the State Department cafeteria, something we have done many times since because Nate, now a senior national political reporter at the Chronicle, is fascinated by “DC insiders” and loves being among and observing them in their “natural habitat.”  
After family updates and a back-and-forth on current events – I got an earful about the “fecklessness” of the UN and its inability to respond effectively to Saddam’s obvious violations of the arms embargo – we gossiped about friends from Reed.  I briefed that Bronwyn, whom we planned to meet for drinks the following day, was dating a guy from Singapore and that a few weeks prior I had had lunch with Aaron who had been in town on business related to the venture capital firm he had just started with two partners.  He was doing well, still single – this was shortly before Sarah – and enjoying life in New York.  
“What a nice little capitalist our Aaron has turned into,” Nate groused, finishing his Evian with a dismissive chug.  “Probably getting laid like a bandit, too, because it’s not enough he’s making twice what we do.”
Nate, always an organized and enthusiastic presenter of what he called  “gouge”, reported his news.  First, Jean-Luc Fournier, the fifth member of our group – we called ourselves The Misfits – had become a sommelier in Paris – “because:  of course” – and was sleeping with the labor minister’s daughter.  
Jean-Luc transferred to Reed during our sophomore year.  He grew up in Zurich, where his French father, now retired, was a banker.  His mother is from Chicago; her family struck it rich during the 1800s patenting and manufacturing large-farm agricultural machinery.  Jean-Luc spent his first unhappy undergraduate year at Stanford, which he called “Stepford” because it was full of “high-achieving robots who thought about nothing.”  In addition to slightly accented English, he spoke French, Italian, and German.  He also “irons his fucking jeans!” Nate breathlessly informed us of one day at lunch after having heard it from someone at French House, Jean-Luc’s dorm.  I ventured maybe this was a European thing.
Second, Savannah Caldwell, who was a junior when we arrived, was “one of those “Earth First crazies” and had got arrested when she and sixteen other Earth First! activists chained themselves to a bridge in Seattle to block a logging route, an action, Nate sarcastically noted, that garnered effusive local support by stalling traffic for an infuriating three hours.  
Third, Maria Hernandez, Nate’s girlfriend for a year or so at Reed, had married “some asshole real estate developer” and moved to New Mexico.  
Mention of Maria reminded me of Graham, whom she had started seeing not long after she broke up with Nate, who at the time was pleased neither with Maria’s “rebound” choice nor the rapidity with which she made it.  Nate despised Graham but swore up and down this had nothing to do with Maria.  It was because, he insisted, “Graham Gumm was a douche, a Talking Heads t-shirt-wearing, Bukowski wannabe douche, pure and simple.”  
As Nate, taking mental notes, watched my colleagues converse over their salads and sandwiches, I shared that Graham apparently was an associate professor at Vanderbilt.  My colleague Jenny, who had been in my Foreign Service Officer entry class and was now a Germany desk officer, had attended a symposium on “NATO and the Evolving Transatlantic Partnership” at The Wilson Center, at which Graham was a featured panelist.  She noted in the participants’ bios that Graham had gone to Reed and, given our similar ages, asked when we met for coffee the following week if I knew him.  I said I did, but that I remembered him as kind of a prick.
“Yeah, he seemed pretty full of himself,” Jenny recalled with distaste.  This pleased Nate.
“Looks like he’s coming up in the world,” I said innocently.  Nate, the eldest of five kids from a working-class Irish-Italian family in Lynn, Massachusetts, had the temperament of a Mediterranean volcano.  It didn’t take much – insulting the Red Sox, invidiously comparing Boston to New York – to inspire a hilarious aria of aggrieved outrage.  Aaron, Jean-Luc, and I over the years had many good hours winding Nate up like a toy and letting him go.  
“Once a poser, always a poser, and that’s all I have to say about it,” he retorted primly.
I laughed.  Nate was happily married – his wife Sophia was terrific – but he was a frequent visitor to the Museum of Old Hurts, in which the humiliation of the loss of Maria – to Graham fucking Gumm – was a permanent exhibit.  
Then I laughed again, remembering how pissed Graham was that day in English class.
“What?” Nate demanded, intuiting the presence of potential information from tonal inflections the way a shark senses prey from blood in the water.   
So I told him the Hemingway story, which, surprisingly, he had not heard before.  Despite it having happened so long before, the play-by-play of Aaron’s besting of Graham delighted Nate, who demanded all the details and listened to them with the perfect attention of a lonely man watching especially needs-meeting porn. 
A brogasm, Nate explained in his essay, is that bonding rush of admiration a man feels when another guy just absolutely nails it.  “It’s Jordan making a circus shot from midrange,” he wrote.  “It’s Hitchens demolishing a smarmy opponent.  It’s Nicholson telling the sourpuss waitress in Five Easy Pieces what to do with the chicken salad.”  During the “brogasmic moment,” he contended, the social norms constraining the expression of masculine regard are briefly suspended, allowing for a spontaneous emotional release the culture otherwise does not permit.  The post-touchdown slap on the ass and the high-five after the perfect retort were, he explained, the coded infrastructure of pure male love.  
A framed copy of the essay’s first page with Nate’s inscription – Aaron schooling Graham Gumm on Hemingway:  brogasm! – hangs on my home office wall.

                                         *     *     *

The almost-full moon, until now obscured by clouds, has suddenly appeared, shining with luminous intensity on the darkened foothills that bound my journey.    
I remember how Aaron connected to other people with astonishing naturalness and ease.  He was genuinely interested in how and what other people thought.  You could be a waitress or the guy sitting next to him at a baseball game:  he would find something to ask a question about then listen with total focus to what you had to say, integrating the input you were providing to deepen and expand his always-evolving understanding of the world.  His perceptiveness was charismatic.  People were attracted to Aaron, especially women – his intense, flattering – and genuine – interest was hard to resist – but I think his unusual sensitivity also made him lonely.  
I think.    
Aaron was closer to me than my actual brother.  Up until the moment I opened that letter from Bradford, Lindstrom & Tsai last July, I would have categorically dismissed any suggestion he would take his own life.  “Aaron was my best friend,” I would have said.  “I knew him.  He would never deem that an acceptable option.”
Given that he had, in fact, killed himself, I clearly did not know Aaron as well as I thought I had.  I suppose we all contain unknowable multitudes.  
And yet.
In the black expanse of the open road ahead of me I see Aaron, naked, standing on the edge.  His feet feel the mineral, granular earth.  The sun is warm on his skin.  Wind from the river moves his hair.  My friend is divesting himself of this life.  It’s a beautiful day.  He closes his eyes, steps forward. 
The signs in this story are clear.  What they signify is not.


 
 




Last Wishes
“Mr. Thompson, good morning,” Jared Ellison says, extending his hand.  “Welcome, come in.” 
“Thank you,” I reply, offering mine.  “Please:  call me Scott.”
I had called Jared the day after I received his letter.  The young lawyer expressed sorrow for my loss and, appropriately balancing sympathy and professionalism, explained the circumstances of Aaron’s death.  Taking care to be clear and precise, he outlined my executorial duties and responsibilities.  Acknowledging near the end of our conversation that he had imparted a lot of information, he urged me not to worry:  Bradford, Lindstrom & Tsai was there to help.  
While he and the team could certainly assist me virtually, Jared told me during that call, it would be easier and probably more efficient to meet in person.  I agreed and arranged to Acela up to New York the following week on the first Friday of August.  Here I was.   
Jared’s letter had disoriented me.  Aaron, who had been absent from my life, was now suddenly at the center of it, but this new presence was, in fact, his permanent absence.  To think about Aaron – how could I not? – was to be deluged with unanswerable questions that triggered more unanswerable questions, eroding memory’s stare decisis.  
I had grieved the end of our friendship, even tried to prevent it, but believed I understood the reasons for it.  
The narrowing of attention and shift in priorities that comes with having kids made my life incomprehensible and, I suspect, tediously pedestrian, to Aaron.  We had less and less in common with every year that passed after my eldest, Adam, was born.  Aaron was a good uncle when the kids were little but his relevance to them and his interest in them waned once they became teenagers.  I can see things from his perspective:  the storms of life and everyday joys that comprise the world of parents are boring if you don’t have children of your own.  To be fair, the feeling was mutual:  I had by my early forties tired of the exciting-single-life-in-Manhattan trope.  
Also, we both had demanding careers.  That mine required me to live overseas for extended periods of time meant that we didn’t see each other as often as we once had.  Aaron, busy with his own life, was unwilling for whatever reason to work through these challenges.  
Eventually, realizing that our friendship had become a solo effort, I stopped trying.  There was no identifiable “end,” no betrayal or heated falling out where we exchanged hard truths that we came to regret.  It just stopped.  I missed him, but the relentless demands of kids and work and life didn’t allow me to dwell on it.
Aaron’s designation of me as his executor, that is to say, his intentional involvement of me in his death, has made me second-guess my understanding of the past.  This is unsettling.  Isn’t the point of memory to anchor us so that we can move forward?  I was now feeling adrift.       
That Aaron had committed suicide – I want to use something softer here, took his own life or died by his own hand – destabilizes the cognitive equilibrium that up until now had served as the foundation for my confidence in my judgments.  I’d known Aaron for over thirty years.  I’d seen him go through some tough times.  He was resilient.  Had anyone suggested that he would one day kill himself, I would have with certitude dismissed it.  No way.  If I was so wrong about this, what else have I missed or failed to understand about Aaron?
Anna, my wife, was saddened but not surprised when I shared Jared’s letter.  Anna liked Aaron and respected our friendship, but she had never been entirely at ease with him, I think out of fear that the sadness that she intuited permeated his life would spill into ours.  I thought her reservations about Aaron were overwrought.  He had issues, but don’t we all?  I suspect, perhaps unfairly, that she was relieved when we drifted apart.

I called Bronwyn first.  “What do you mean Aaron’s dead,” she demanded sharply, as if I were intentionally provoking her.  I let the blast dissipate.  I knew from my experience making death notification calls early in my career as a consular officer that most people on being told a loved one has died react with shock or anger rather than grief.  Grief comes later.  She continued in full-throttle lawyer mode:  what had happened, where, who says, when was this?  
Nate, by contrast, shocked and deeply saddened as he slowly absorbed the news, struggled to speak.  When he recovered, he too would want to know every detail.  Bronwyn mobilized.  Nate analyzed.  
Jean-Luc, I knew, whom due to the time change I put of calling until the following day, would become cooly philosophical, an outward detachment that gave him the space he needed to circle his wagons and process the shock.
I had yet to notify Sarah, Aaron’s almost-wife, for whom I had no contact information.  None of us had spoken with her in years.  This was at Sarah’s request.  If I couldn’t find a phone number or e-mail for her online, Jared might be able to help.  Calling Sarah would open old wounds.  I dreaded it.    
Jared motioned me to a small conference table next to a window with a magnificent view of the city, East River in the far distance.  It was a bright morning.  The big sky was cloudless and blue.  This was New York City in refulgent full summer.  A ferry boat was slowly making its way upstream.  Despite the sad personal circumstances that had brought me here, I couldn’t not appreciate this beautiful day.  I had taken my time during the short walk from Penn Station.  Life, Manhattan, this moment of August.
“Again, please accept our condolences for your loss,” said Jared, in front of whom lay a file folder containing packets of paperclipped prepared documents.
Jared.  I don’t need to describe him in detail:  there are a million Jared Ellisons providing expensive legal advice in cities across the United States.  They are all intelligent, precisely groomed, attentive men in well-made dark blue suits.  I don’t trust cultivated perfect composure.  The quieter the surface, my experience has been, the deeper – and, more often than not, the darker – the water.   
 Jared laid it all out.  My primary responsibility as executor was to ensure that Aaron’s final wishes were fulfilled.  The process to do this was straightforward.  First order of business:  he would on my behalf submit Aaron’s death certificate and will to Surrogate’s Court and file the necessary paperwork for me to be legally appointed as executor.  Since Aaron had no heirs or known creditors, once the court had issued letters of testamentary confirming my legal authority as executor, I would notify his beneficiaries, secure and inventory the estate, distribute assets, and pay any debts and expenses.  Additionally, a Notice to Creditors would have to be published in the Times.  Jared and the team would of course assist me in all this.
The final step would take place the following spring, when I would file Aaron’s final personal tax returns and provide a comprehensive accounting, which would close the estate.  Bradford, Lindstrom & Tsai’s go-to accounting firm, Upchurch Corrigan Group, was prepared to assist me to handle the financial requirements pertaining to the estate.  This “outfit” was “one of the best” in Jared’s opinion, but I was free to employ an accountant of my own choosing if I so wished.
I said Upchurch Corrigan would be fine.
Jared opened the file folder.  He moved a watermarked document with a blue-scalloped border to the other side of the file.  The death certificate, I gathered.  He passed me a copy of Aaron’s will.  
Strange to see Aaron’s life, or what remained of it, reduced to a series of paperwork tasks.
	I read.  Aaron, a resident of the State of New York, being of sound mind and disposing memory, and not acting under duress, menace, fraud, or undue influence of any person whatsoever, made thirteen personal bequests.  
He left Sarah $500,000.  
He left Bronwyn, Nate, and I $100,000 and $250,000 in trust for each of our children, stipulating that the funds be used for purposes that support their advancement in life, including but not limited to higher education, vocational training, or as seed capital for a business venture or other meaningful opportunity intended to secure their future.  He directed a $100,000 contribution in Jean-Luc’s name to Médecins Sans Frontiers, a charity both felt passionately about.
In recognition of and gratitude for her years of faithful service, he left his PA Janelle $50,000 and established a $100,000 special needs trust to provide for the supplemental and extra care, support, comfort, and education for her son Quincy, who had sustained a head wound in 2007 in the Iraq War and lived semi-independently with her in Queens.  This would mean a great deal to the wonderful Janelle, who had worked for him for over twenty years and with whom we had all dealt many times over the years trying to get a piece of the always overscheduled Aaron’s time.  It was Janelle who, recognizing how tight our friend group was, had dubbed us the “Misfits.”
Aaron also bequeathed $1.2 million to Reed to endow a scholarship, to be known as the Aaron Sullivan Memorial Scholarship, that shall be awarded annually to students in accordance with criteria to be determined by the College, with preference given to students from rural areas who demonstrate financial need, academic merit, and a strong commitment to intellectual and creative exploration.  This bequest did not surprise me.  Reed had been such a formative experience for Aaron.  We had both received financial assistance, without which four years of private college would have been out of reach.  I was happy that, thanks to Aaron’s generosity, more kids from modest backgrounds would be able to attend Reed.  My preference is that my Executor, Scott C. Thompson of Arlington, Virginia, serve if he is willing, and for as long as he is able to do so, on and as the director of the Scholarship’s selection committee, given his personal understanding of the Scholarship’s criteria.
This will be our legacy to Reed, is what Aaron was saying.
Finally, Aaron left $50,000 to the Latham Public Library, in furtherance of its mission to provide cultural and literary resources in historically underserved rural areas.
I smiled when I read this because it sparked a memory that highlighted a cultural fault line within the Misfits.    
Nate and Bronwyn were city kids.  They had an almost anthropological fascination with my and Aaron’s rural upbringings and constantly asked us to tell them stories about how we grew up.  When Aaron told them about going hunting with his uncle and his factory worker friends or I talked about driving with my family to watch Kilauea Volcano erupt, they would listen to us with the kind of near-unbelieving fascination Levi-Strauss must have felt when he first encountered the Caduveo and Bororo in the deep corners of Brazil.  
One evening over dinner – this was sometime in the nineties – Bronwyn recalled a kids’ event she attended at the New York Public Library that had featured a performance by the cast of a popular family-oriented Broadway musical.  
“Must have been nice,” Aaron replied.
Confused, Bronwyn said:  “Surely you had libraries where you grew up.”
“Yes, the small towns in fly-over America had libraries,” Aaron reassured her, “but they were more modest facilities offering humbler public entertainments, and they were not guarded by marble lions.”  
Not for the first time, Bronwyn gave him the finger.  
“I loved going to the library,” he recalled, ignoring her.  “It was only eight blocks from our house, and on the way to the school, so even as a little kid I could go there pretty much whenever I wanted.  I used to sit there for hours reading, especially in the summer because the library had air conditioning.  I would go there every Saturday after cartoons.  Sometimes they had special programs like a puppet show or a scavenger hunt.”
This was such a happy memory for Aaron.
“The Yankee Magician was a repeat performer.  We cracked up at the way he talked.  I learned later he came from somewhere near Boston and travelled regularly with his wife to Birmingham to visit their daughter who was married to a guy from Homewood.  
“It’s weird, but I loved the smell of that place:  the fragrance of humidity, books, and wood polish.  There weren’t any windows, so inside it was dim, almost like our church.  It felt like a sanctuary.  When I got older, I would stop at the library after school to do my homework.    
“Miss Dottie was the librarian.  Her assistant, Mr. Drew, was a high school classmate and friend of my Uncle Whitman.  They must have seen potential in me because they encouraged me academically and would suggest books.  The Three Musketeers.  Tom Sawyer and The Adventures of Huckleberry Finn.  The Hardy Boys. And, as I got older, To Kill a Mockingbird, Fahrenheit 451, and eventually Dickens and The Old Man and the Sea and The Catcher in the Rye, which Mr. Drew made me promise not to tell anyone he had recommended. 
 “They knew I didn’t come from much and recognized that I needed an intellectual refuge.  They were Latham’s cultural custodians and shared with me the one they had created.  When I graduated from high school, they gave me $50 and a fountain pen, which I still use.  They were so proud I was going to college.”
It’s easy to forget, as an adult, how important it is for kids to feel seen.
The will stipulated that the remainder of Aaron’s estate be distributed to The Abbey of St. Joseph the Father Trust, of which Bradford, Lindstrom & Tsai were trustees.  This included his financial accounts, which would “pour over” into the trust.  No action was required on my part.  Out of curiosity, I asked Jared how much money would remain after the bequests were paid out and go to the abbey.  He demurred with a regretful smile:  the financial and other arrangements of the trust were confidential.
So there were limits to Jared’s willingness to oblige.
I didn’t really care.  What Aaron did with his money was his business.  It was lovely of Aaron to remember our children in this way – and I would be lying if I said I was not thrilled at no longer having to save for college.  Federal service in the national security realm has many rewards, but generous remuneration is not one of them.  I was also pleased by his bequests to Janelle, Reed, and the Latham public library, each of which would keep his memory alive in such a beautiful way.
The $500,000 to Sarah was another matter.  “She’s not going to like that,” predicted Nate, correctly as it turned out.  Aaron was good at making money and generous with spending it but did not understand that what for him was an expedient – money allowed you to do the things you wanted to do and buy the things you wanted to buy – was for many, if not most, people a reagent that, if not handled carefully, can alter and even fundamentally reorder interpersonal dynamics, usually for the worse.  That is to say, he did not fully grasp, as a person in his position should have, that money changes everything.  
This lacuna notwithstanding – was it simply a kind of innocence? – Aaron had a healthy relationship to money.  Aaron was not some slippery, “greed is good” financial operator.  To be sure:  even in college Aaron was fiercely determined to be “successful”, which he understood to mean financially independent and thus not beholden to anyone.  In retrospect, Aaron’s clarity and focus on his professional future – he definitely had a north star – seem uncommon for such a young person, but this should not obscure that money was a means for Aaron, not an end.  He didn’t want to be rich as much as he was hell bent on not being poor.
Which is how he grew up in Latham, Alabama, a small town on the outskirts of Birmingham.  Aaron was an orphan:  he never knew his father, and his mother died when he was very young.  He was raised by his grandmother, who, judging from his stories, was an emotionally parsimonious piece of work.  Aaron was not bitter about his childhood, but nor was he sentimental.  The leitmotif of his recollections about growing up rural and poor, although he didn’t articulate it quite this way, was that living in poverty meant living without choices or, to be more precise, in a situation where your choices were determined by others.      
Success in the financial sector meant he could chart his own course.  Even after he was monetarily well established, he continued at Catalyst Capital because, he explained, venture capital was at its essence about seeking and promoting the realization of potential, which he found exhilarating.  Aaron thought deeply about things.  He didn’t buy a lot of stuff.  He was generous.  
Educated middle class Americans tend to romanticize people who manage to lift themselves out of poverty.  Everyone loves a rags-to-riches story and the class triumph of a determined underdog.  When Aaron was profiled in the mid-90s as one of Fortune’s “40 Under 40,” Jean-Luc described him as “our own Gatsby”, inferring that by becoming rich, Aaron had, like that novel’s protagonist, reinvented himself, it being understood that such a desire was a quintessentially American quality and possibility.  There is an appealing romance in this interpretation but it and all the “jazz age” stuff – the flappers, the extravagant parties, the blue lawns of East Egg – obscure a more basic, and I think even more American, theme:  the simple desire not to be poor, and the conception of America as a place where making that change, if you’re smart and work hard enough, is possible.   
That said, while Aaron was not Gatsby, there was certainly a Daisy-esque quality to Sarah, at least in Aaron’s mind.  What I mean is this:  in Aaron’s post-breakup recollections, Sarah featured less as an actual person than a symbolic representation of what he perceived as an existential loss.  Sarah had held the key, if only Sarah would return, she was The One.  I felt for him, and tried to be of comfort, but his chronic, ruminating grief turned from romantic loss into self-indulgent if-only-X-I-would-be-happy magical thinking.  I see nothing romantic about Gatsby pining for the out-of-reach Daisy.  He, like Aaron, should have just grown up.
As for the bequest to the monastery, Aaron as best I can remember had never been particularly religious.  His Catholic grandmother had taken him to mass every Sunday when he was a child, but my sense was that Aaron viewed his religious indoctrination as an integral component of an upbringing he had left behind when he moved to the Pacific Northwest for college and now regarded from a disapproving distance.  Perhaps this had changed.  Aaron was a seeker.  That Aaron would posthumously fund what I presumed was a charity, albeit a religious one, struck me as a fine and sensible choice.   
Jared seemed puzzled and even a little annoyed that I was taking so long to read a fairly straightforward will.  He looked relived when I finished and returned the will to its file folder.
I didn’t like Jared, I noted with interest.

To my current dismay the pleasant two-lane parkway that for the last few hours had wound through the densely wooded foothills of the Blue Ridge mountains has turned into a four-lane highway bordered on both sides by strip malls and gas stations.  Cheap electronics, fast food, discount clothing, more fast food, “designer” home furnishings and accessories:  so much ugly detritus of restlessly consuming America.  Large billboards featuring the avaricious faces of ambulance-chasing personal injury lawyers intermittingly interrupted this uninspiring vista like piles of dog excrement.  
I had been on the road for six hours and was nearing the half-way point of my drive.  It was almost 11:00 pm.  I had stopped for gas and eaten dinner a few hours earlier.  I was tired and looked forward to getting some sleep.  

Having walked me through the will, Jared unpaperclipped and passed me duplicate copies of documents to sign.  These would be notarized when we were done, with a copy returned to me for my records.  I should retain these and be sure to keep good records as I discharged my executorial duties.  Any expenses I incurred would be reimbursed, including my travel to New York and taxis, meals, and incidentals while I was here.  
No, I didn’t have any questions at this point, though these were bound to come up as we went along.  Yes, I would not hesitate to contact him any time I had a question or needed assistance.  
Jared handed me an envelope.  
         “Mr. Sullivan asked that I give you this.”
I took the envelope.  Should I open it now or later?  Jared stood and excused himself, saying he would give me a moment.  If I needed anything, he would be just down the hall.
The letter was handwritten on a piece of standard copier paper and dated the previous month.

Scott:
	How do you start when you don’t know how or where to begin?
Answer:  You just do it.
Thank you for taking this on.  I’ve tried to make things as easy as possible for you.  Really all you need to do is oversee the process.  Let Jared help you.  I’ve worked with him over the last few years and not just on my personal stuff.  He’s very capable. 
I know I’m asking a lot.  
I considered having the law firm take care of everything, but it felt wrong to have an intermediary between us.  Also, I don’t want Nate, Bronwyn, Jean-Luc, and Sarah to learn of my choice from a law firm; it’s bad enough you had to.  I’ve left letters for all of you at the apartment.  Mostly, and selfishly, it’s because I don’t want to do this alone.  I want you with me in this definitely nonsecular space.
I have an additional request.  
I’d like you to inform my father, Isaiah Davis, and my uncle, Carter Sullivan, of my death in person.  As you know, my father was not a part of my life growing up, and Carter is a redneck asshole, but they are the only blood family I have (my grandmother died in 2005) and I feel – I’m not sure why, but I do – a filial obligation.  I considered writing them, but a by-the-time-you-read-this-I’ll-be dead letter coming out of the blue after so long seemed macabre to me.  You will be able to explain it better than I can.  Carter lives in our house in Latham.  I don’t know where my father is but have asked Jared to locate him for you.      
Please no funeral or obituary.
	I didn’t know where to start and now I don’t know how to end.  
One of the most beautiful things about you, Scott – you who could never see your own beauty – is your sense of responsibility for the world.  Your connection to other people, your full presence in the here and now, I see as a living act of faith.
	Thank you again for doing this. 
 
Aaron 

I folded the letter, put it back in the envelope, and stared awhile at nothing.
Nonsecular space.
Aaron and I had talked about this a lot over the years.  
In life, we agreed, we move between the secular – the day-to-day of going to work, paying the mortgage, servicing the car, buying groceries, making dinner, figuring out in February where the kids will go to summer camp – and the nonsecular, the spiritual place where beauty, art, God, and our mystical higher selves exist.  We took this seriously, the need to live intentionally so that we could live well.  We did our best to make time in our busy, post-industrial American lives to witness beauty, expose ourselves to wonder, and feel gratitude.  
I understood what Aaron was asking.  He had made a fearsome decision.  Having me with him as he made final arrangements and knowing I would be here now was a comfort to him.  I did not understand or condone Aaron’s “choice,” but he had made it and asked me to be there for him.  A sense of obligation tempered my grief.
If this is what you want, brother, so be it.
 




Crime Scene

Jared returned to the conference room.  Ever solicitous, he asked if I needed more time.  I said I did not.  
Predicting it would take three to four weeks to get the letters testamentary that would allow me to distribute Aaron’s assets, Jared suggested we meet again in mid-September.  In the meantime, he would prepare the beneficiary packages I would need:  a letter informing the beneficiaries, a check, and an acknowledgement of receipt (or refusal) to be signed and returned in an enclosed self-addressed envelope.  

Although I could not take any formal actions on the estate’s behalf until I was appointed executor, Jared saw no reason why I couldn’t maximize my time in the city today by beginning to inventory the contents of Aaron’s apartment and determine how I wished to dispose of the contents.  Ashleigh, his assistant, had the keys and would be happy to accompany me to the property.
It was nearly 11:00.  I was booked to return to Washington on the 4:00 train.  This would be an efficient use of my time. 
Aaron lived in the upper two floors of a converted brownstone on Murray Hill.  During the fifteen-minute walk from the law office, Ashleigh tried to keep the conversation light – asking about Washington, commenting on the weather – but Aaron’s letter had unmoored me and deepened my feeling of loss.  Seeing his handwriting had been like hearing his voice.   
How had we not known the depth of his despair?  What had happened over the last few years to make Aaron take his own life?  Why didn’t he reach out to me, to us, to anyone?  How could things have been that bad?
We walked up Aaron’s stairs.  Ashleigh unlocked and opened the door.  I turned on the foyer light, picked up a few pieces of mail and, quickly determining they were junk, dropped them into the recycling box Aaron had set next to the door for this purpose.  Ashleigh seemed surprised at my familiarity with the place.  How much had Jared told her about my relationship to Aaron, I wondered.  How much did he know?
Aaron loved living in this apartment.  He had taken his time post-Sarah to choose it because he wanted a place with “character” that would feel like home.  He liked that it was on the smaller side and surrounded by a lot of greenery – you could see treetops from the large bay windows on the first floor – the “parlor floor,” Bronwyn would always correct me – that also flooded the airy, high-ceilinged room with natural light, especially the red maple that leaved in flaming crimson in the fall.  On the walk over, I had been dreading the prospect of poking around Aaron’s place and invading his privacy.  Standing in his living room now, it didn’t feel that way at all.  The clean and orderly, and eerily quiet, apartment felt processed to me.  It felt like we had entered a crime scene.
We sat on the sofa.  Anna, who has a keen eye for interior design, had helped Aaron pick it out at Restoration Hardware.  Ashleigh, who didn’t know this, explained our mission.  As executor, it was my responsibility to determine what to do with the contents of the apartment.  She would record my decisions and develop an inventory, noting the disposition of each item.  I could throw things out, donate them to charity, pass them to others, or keep any sentimental items of de minimus cash value for myself.  Furniture, appliances, and similar items would be disposed of through an estate sale, assuming I approved this (most people, she noted, found estate sales an easy and efficient option).  Finally, she would prepare a comprehensive inventory that I would endorse once the court issued letters of testamentary. 
Ashleigh picked up a clipboard from the coffee table where she had prepositioned packing and other materials.  Clearly she, and probably others, had spent time in the apartment.  This bothered me.  Ashleigh extracted a garbage bag from a box on the table and handed it to me, explaining that others she had assisted in “personal effects disposal” had found it useful to be able to “trash” various items as they went along.  
We began in the living room which, like the rest of the apartment except for Aaron’s home office, was tastefully but impersonally decorated.  Part of this was because design was not Aaron’s thing – he was repelled by styled interiors, which he believed subordinated the human authenticity of truly lived-in spaces to wealth-signaling aesthetic performance – but mostly it reflected the absence of a woman.  Aaron’s décor, such as it was, was, like most masculine spaces, functional and minimalist.
The pile of old magazines and newspapers could be recycled and the opened bottles of liquor and wine in the bar area disposed of, I told Ashleigh; everything else could be sold.  Aaron had purchased expensive, well-made furniture and quality furnishings.  This would be a high-end estate sale, I thought bitterly, dismayed at the thought of acquisitive strangers indifferently milling around my friend’s home and handling his things.  Bronwyn loved the beautiful Qashqai carpet he had purchased in Istanbul that I was now standing on.  I texted her.  
Scott W.		At Aaron’s.  Not to be ghoulish, but do you want the Qashqai?  
Bronwyn K. 	I understand.  Yes.
Scott W.		On it.
Bronwyn K.		Thanks.  How’s it going up there?
Scott W.		As expected.  Weird.
Bronwyn K.		 
The kitchen took little time to process.  As I expected – Aaron was a single man who didn’t like to cook – there wasn’t much in the refrigerator:  condiments, beer, butter, a jar of dill pickles, a half-full jug of orange juice; a few bags of frozen vegetables, some bacon, and a bag of coffee and tub of vanilla ice cream in the freezer.  The pantry was similarly sparsely stocked.  Ashleigh said she would take care of food and other perishable items.  
I told her that the dishes, silverware, and whatnot, as well as the small appliances, could go to Goodwill or the estate sale.  Apologizing for her “unprofessional request,” she asked if she could have the two houseplants on the windowsill.  “I just hate to throw away living things.”  I told her of course – she should feel free to take anything of this sort she wanted.  
I felt very tired.
We went up to the second floor, passing my favorite feature of the apartment:  two recessed bookshelves, one at the head of the stairs, the other along the narrow hallway that separated the primary bedroom from the guest room and study.  Aaron had a nice collection of a few hundred books housed in these shelves.  His literary taste was broad and eclectic.  He liked everything:  nonfiction, poetry, and philosophy as well as fiction, especially the classic European novels.  We differed in this regard.  I’m interested primarily in modern American writing and read deeply rather than widely.  I’m a completist:  if I like a writer, I usually try to read all his or her work.  This has limited my horizons.  
We started in Aaron’s bedroom.  I asked that Aaron’s professional clothing, including his shoes, be donated to one of those groups that provide business wear to men struggling to improve their lives but who can’t afford appropriate clothes for job interviews.  Aaron would have liked this.  Ashleigh thought this was a great idea.  The rest of his clothing could be given to Goodwill or saved for the estate sale.
I had the urge to smell his t-shirts and would have had I been alone.
The only decoration in the room was a large, handsomely framed Turner-esque landscape of mountains in a gathering storm:  dark clouds, imminent rain, trees bent by a fierce wind.  Aaron was neither a collector nor an educated appreciator of visual art; I didn’t recognize the painter’s name and, although I liked it, doubted the piece was of any great value.  I asked Ashleigh to confirm this.  If it – or any of the other prints or art works in the apartment for that matter – was worth something, it should be auctioned and the proceeds returned to the estate.  If not, it could be left for the estate sale.  
Aaron’s bed was made.  A pair of reading glasses lay on his nightstand.  I opened the drawer below.  Condoms, lube, two pens, a sleep mask, a book of sudoku puzzles, packets of lens wipes, a prescription bottle of Ambien, a quarter, and a pair of nail clippers.  To protect Aaron’s privacy (from whom?) I put the condoms, lube, Ambien, and sleep mask in the garbage bag.  I told Ashleigh she should dispose of the rest of it as she saw fit.
I did not like this forced proximity to the biologically intimate details of Aaron’s life, did not like standing over the bed where my friend had slept and made love.  It was like being compelled to watch another man defecate.  It was invasive and not my business.
The bathroom was pretty much as you might expect.  There were four prescription pill bottles in the medicine cabinet which I trashed without looking to see what they were, along with Aaron’s toothbrush.  On further thought, I threw it all – cold relief products, shaving things, oral hygiene stuff – into the garbage bag.  A plastic dental floss container fell noisily onto the tile floor.  No one else needed to see these private things.  
We moved to the guest room, which I knew well.  Everything here could be sold, I told Ashleigh.  There was nothing in the closet but an extra blanket, some empty hangers, and a luggage rack.  The nightstand drawers were empty (these were purchased the same day as the sofa; Anna had convinced him to choose the light gray color).  Ashleigh made a note.  
Next was Aaron’s study, clearly the heart of the apartment.  Unlike the other rooms, this one felt lived in and reflected Aaron’s personality.
Between the two north-facing windows with views of the residential blocks of Thirty-Eight Street and the top of the Chrysler Building hung three framed record album covers:  Miles Davis’s Kind of Blue, Coltrane’s A Love Supreme and Joni Mitchell’s Hejira.  On the wall facing the desk there was a University of Alabama  , a clock, a colorful if  busy-to-the-point-of-disorienting Miró print, and a framed signed photograph of Aaron with Bill and Hilary Clinton, of whom Aaron was an enthusiastic admirer.   
  The five envelopes Aaron had mentioned in his letter were on his sturdy Ethan Allen desk, to the right of which, near the wall, was a thriving Weeping Fig tree in a blue and white porcelain pot.  Ashleigh, confirming what I had thought – that she had been here before – said that since these were personal items with no inherent monetary value, I could take the letter he had left for me now, even though I wasn’t yet “official.”  For some inexplicable reason, this annoyed me.
I sat at the desk.  It felt…vacant.  
I realized:  Aaron had planned this.  Entering his apartment with a stranger and itemizing and disposing of his personal property didn’t feel like the invasion of his privacy I had feared it would be because, in fact, it wasn’t.  Aaron had carefully thought it all out, purportedly to make it easier for me.  This apartment, which had once been Aaron’s home and was a place I had visited many times, now had the curated impersonality of a hotel room.  
The implication of Aaron’s (manipulative, almost, it seemed to me) planning – that his decision to kill himself clearly was not made in a state of extremis – troubled me.  If he had had the mental fortitude to minimize the burden of my executorial duties, how could he have not figured out a way to seek help?
Another question occurred to me as I looked up at Ashleigh standing there with her clipboard:  to what extent had Jared been aware of Aaron’s plans?  Indeed, had he been complicit?
Aaron was a clean-desk person:  except for a cup of pens and a dispenser of Post-It notes, the desk was bare.  There was a monitor, and a printer on a side table, but no computer.  I asked Ashleigh about this.  She shrugged with open hands.
I opened the pencil drawer.  Nothing other than the usual:  paper clips, pens, envelopes, and stamps.  Ashleigh could do what she wanted with it all.  
The upper file drawer contained financial documents.  I took a quick look then asked Ashleigh to convey them to Jared since Bradford, Lindstrom & Tsai, as the trustees of Aaron’s trust, were handling the financial parts of Aaron’s estate.  I found a document that looked like a diploma.  This was Aaron’s Certificate of Reception into Full Communion with the Catholic Church.  It was dated two years previous.  Well, I thought, there’s one question answered.
  Aaron’s conversion still seemed so out of character to me.  I wondered what had changed in his thinking.  Aaron was someone who, when I knew him at least, would have described himself as spiritual rather than religious.
I recalled how during college, he, Nate and Jean-Luc, who were also raised Catholic, would entertain themselves seemingly for hours reminiscing, with Protestant me listening in perplexed wonder, about their Catholic upbringings:  interminable masses, hypocritical nuns, and drunk priests.  For some inexplicable (to me) reason, they recalled with special fondness the nunial torture they had endured at Catholic school.  
Looking out the window, I remembered as I watched a murmuration of starlings ascend, sharply drop, then fly off into the blue distance Aaron recounting during one of these “Catholic conversations” how his grandmother, determined to see him baptized, had overcome the obstacles to this posed by his illegitimacy.      
This was in the days before the Church revised its theology on limbo and the fate of the unbaptized, he explained.  “My grandmother was deeply troubled by the possibility that I would be deprived of the beatific vision – seeing God in heaven – should I die without being baptized.  
“Dieu ne plaise!” Jean-Luc remarked in mock horror.
“Given to understand by our disapproving parish priest that while a public baptism in church for the child of an unwed mother was canonically permissible but socially ‘delicate,’” Aaron continued, “my grandmother struck a deal with him:  she would not insist on a public baptism and thus preclude the unwelcome controversy such a request would create, if he would confer the sacrament informally.  He agreed.  She invited him to lunch and, with no witnesses, he baptized me.  The priest told her there would be no parish record, but that “God would see.”  
“Were you confirmed?” Nate asked.  
“No.  A parish-blessed public profession of faith and first communion would have been a bridge too far – especially after no formal baptism.”
I put the certificate back where I had found it.
A thin blue leatherette photo album lay among a box of tissues and computer cleaning supplies in the bottom drawer.  The cover was stamped with Your Life in gold lettering that was beginning to peel.  Inside were photographs, mostly black and white, of Aaron at various stages of growing up, beginning with a baby picture and ending with what I assume was his high school yearbook portrait.  There were fill-in inserts like I’ve Arrived! and Baby’s First… where Aaron’s grandmother (I presume) had recorded in both pen and pencil things like Aaron’s time of birth, delivery weight, and when he first walked and talked.  I put this in my satchel.
On the credenza behind Aaron’s desk there was the tin Starsky and Hutch lunch box he had found at a thrift store our sophomore year and used to stash his drug paraphernalia.  Seeing it on the shelf with other vintage lunch boxes that day had sparked our memories of elementary school.  Aaron said he had had the same Starsky and Hutch lunchbox when he was a kid.  Mine had featured Steve Austin, the Six Million Dollar Man, which was cool because we had the same name.  We remembered how you had to be so careful not to break the glass in the thermos, which of course we always ended up doing anyway.
I took the lunchbox and sat at the desk.  Under Ashleigh’s watchful eye, I lifted the little latch and opened it.  It was filled with items that must have been of profound personal importance to Aaron.  
I felt an overwhelming sadness.  This was the precious detritus of my best friend’s life.  It also moved me that Aaron had wanted me to see these things – otherwise, I reasoned, he would have thrown the lunchbox out.  But what was I going to do with it?
This would be an emotional undertaking for another time.  I placed the lunchbox next to my satchel.  Today was about getting the business part done.  Onward.
Aaron’s diplomas from Reed and Wharton hung on the wall behind the credenza.  There was a photograph of all of us, taken at Nate’s wedding.  We were all happy, and very young.  There was also a crucifix, which was new, at least to me.  I took down the photograph and put it in my satchel.  Nate would appreciate it.
I told Ashleigh the books could be sold, but that there were likely some valuable first editions and she should sell them to a used bookstore that would know their value.  I suggested The Strand.  She undertook to do that.
Looking at the titles of the books brought back specific memories.  Fear of Flying, for example.  We all agreed that the book had a certain cultural value – it captured the Seventies feminist cultural moment just as On the Road (“That’s not literature, that’s typing” – Truman Capote) captured the Beat Generation – but we also agreed that the writing was atrocious and the plot risible.  Aaron used to tease Bronwyn about it, accusing her of complicity in a literary crime.  She, in sisterly solidarity, would defend it even though she secretly agreed with us.  Remembering this – Bronwyn would get so pissed, which just made Aaron double down – made me laugh out loud, to Ashleigh’s bemusement.  I pulled the book down and added it to my satchel.  I smiled in anticipation of Bronwyn’s reaction.
For Jean-Luc I found Patterson.  This was another college memory.  Seeking to strengthen his tenuous American acculturation, he had asked us to identify quintessentially American poets.  I proposed Whitman.  Nate chose Frost.  Aaron thought Williams.  Jean-Luc ultimately agreed with Aaron that Williams was the most American.  
For Nate, it was Absalom, Absalom.
I did not neglect myself.  I collect modern first editions as a kind of hobby, several of which I’ve had signed at readings and other events.  I scanned Aaron’s bookshelves.  I knew exactly what I was looking for.  And there it was:  a difficult-to-find, way-too-expensive signed first edition of The Bluest Eye, Toni Morrison’s first novel.  I don’t know how he had found it, but find it he had, and he loved reminding me of it.  I had long coveted this book.  Well, I figured, Aaron wouldn’t be missing it now and, anyway, there should be some sort of compensation for the executor.  This was business, not personal.  
There was a Post-It note on the cover with “I win” written on it.  I shook my head.  You won, alright.  
How could it be that this beautiful man was gone?  
Determined that Aaron would not have the last word, I located another hard cover I’d been unable to find, The Electric Kool-Aid Acid Test, and for good measure also commandeered his first edition of Portnoy’s Complaint.  The dust jacket of the copy I had was ripped.  This one was perfectly intact.  Who’s the winner now? I silently asked.
I put the books in my satchel.  I would have to carry the lunchbox.  This would amuse my fellow commuters, especially those of a certain age.  Aaron would have the last laugh after all.
Exhausted, I told Ashleigh I thought we had about covered it.  She seemed pleased with our work.  She reiterated that she would type everything up and submit it to me for my formal approval once I was appointed executor.  I thanked her for her help.  She said she had some work to finish up in the apartment; did I need help to get to Penn Station?  I said I did not.  
It was 2:30.  I was ready to go home.  

*      *      *

I pulled down the table from the seat in front of me and opened Aaron’s lunchbox as the train pulled out of Trenton.  I was right that others would notice it.  The guy in the seat to my left, who was about my age, chuckled.  “That certainly takes you back, doesn’t it?”  I said it sure did.  He gave me privacy and returned to his Wall Street Journal.  No such luck with the little boy sitting next to his mother across the aisle who unabashedly watched me, intrigued by the tin box as well as Starsky and Hutch’s bright red Ford Gran Torino with its cool white vector stripe.   
On the top there was a bunch of letters secured by a rubber band.  These included the thin blue-paper aerogrammes I had written him from Morocco when I was a Peace Corps volunteer as well as letters, cards, and notes from other friends, some of whom I recognized and others I didn’t.  One of these was a postcard from Nate postmarked Paris, April 6, 1987.  One side pictured the Panthéon, the other was inscribed:  Imagine an entire country of people who iron their jeans!  Jean-Luc sends his regards.
Next there was an envelope of photographs:  Anna and I getting married; Nate and Sophia cutting their wedding cake; Aaron, Nate, Jean-Luc, and I clowning during our senior year; a young Bronwyn giving the photographer the finger; several of him and Sarah; a baby photo; and a black-and-white high school yearbook portrait of Aaron’s mother, with Mary-Rose Sullivan, 1962 written on the back in careful cursive.
Under these was a neatly folded, now yellowed clipping from Reed’s student newspaper, The Quest.  The article, written by Jim Corelli, our fly-half, enthusiastically reported a rugby match we had played (and won) against Whitman College in Walla Walla in the fall of 1981.  It featured a black-and-white team picture.  My sons, I realized as I looked at the grainy image of the assembled young men, were now almost the age we were then.  
I also found some weed and a pipe, which I quickly hid under the letters.  Once a stash box, always a stash box.
Finally, there were:  two arrowheads; a scrap of paper with a hand-written stanza from the E. E. Cummings poem with that wonderful line about the wonder that keeps the stars apart (I didn’t recognize the handwriting); an expired passport filled with visas and entry/exit stamps; a chunk of metallic silver-grey rock with red colorations running through it; a black fountain pen; a “Vermont” snow globe-type thing featuring trees in fall foliage with tiny red, orange, and yellow leaves instead of snowflakes that swirled around the trees when you shook it; two foreign coins, one with Cyrillic writing; a Latham Public Library card; a key, and a Springsteen concert ticket stub.
I took another look at the Quest article.  That had been a great game.  In the second half I intercepted a Whitman pass and, stunned that I had possession of the ball – it was usually the backs who led offensive play – ran like hell to score my first (and only) try.  Aaron, who was a winger and a much better player than me, also scored a try that day.
My seat mate had reclined his seat and was napping, newspaper folded on his lap.  I watched the fields and towns fly by.  
I wondered who had given Aaron the Cummings poem, and why he had kept it.  I considered reading the letters I had written to Aaron from Morocco but in my emotionally depleted state couldn’t bear the thought of confronting the unformed doofus that was the twenty-three-year-old me.  The aerogrammes with their red-and-black par avion markings reminded me, however, of how Aaron, in response to my lamentations of the carnal challenges of life in a conservative Arab village, had mailed me a copy of Playboy.  God only knows how it got past the postal censors.
Jesus.  We were so young.
Bob Seger’s Night Moves comes to me unbidden, the last verse where the instrumentation stops and he sings of waking to the sound of thunder of uncertain provenance.  He has been thinking, and perhaps dreaming, of his long-passed teenage years.  Deep in memory, he hears himself hum a song from 1962.
Strange how the night moves
With autumn closin' in
The little boy was fast asleep.  I closed my eyes too.
 




The Last Time I Saw Aaron

Bristol, where I’m overnighting, half-way between Arlington and Birmingham, is a charming old railway town in either Virginia or Tennessee, depending upon which side of its shared main street you’re standing on:  the state line runs down the middle.  Simply for the satisfaction of having made it to a different state, I decided to stay on the Tennessee side.  (This drive has reinforced my awareness that I live conceptually and physically inside the Washington beltway.  I keep forgetting how big this country is.  I had been driving for almost six hours in one state.)  
Waiting for sleep in over-laundered hotel sheets I thought about the last time I saw Aaron one-on-one.  It was an unpleasant visit.  This was in late September 2006 during the opening of the United Nations General Assembly, an annual diplomatic gathering attended by foreign leaders and senior U.S. officials.  State Department working-level personnel travel up to New York to take notes at the many bilateral meetings held during “UNGA.”  These are great assignments, especially if you aren’t assigned too many meetings:  once you write, clear, and file your reports, the rest of the day is yours.  Plus you get put up at the Waldorf, since many of the meetings take place at the Secretary of State’s suite there.  (My tiny room during this visit overlooked an electrical shaft, but still:  it was the Waldorf!)
It had been some time since I’d last seen Aaron.  It was hard to get leave from work and harder still to spend time away from the family. The brief work trip I had finagled – I went up Wednesday, to return the next day – was a perfect solution.
I note-took for two meetings, finishing my work a little after 3:00, which left me time to walk for a bit in the city before meeting Aaron in Midtown East for dinner at a Russian place he liked.  He greeted me warmly when I arrived, but said he had to leave by 8:00 to meet a friend, Tatjana Someoneovic, an aspiring filmmaker from one of the former Yugoslav republics.  This disappointed me – I had expected to spend the evening catching up – but I was happy to see Aaron in high spirits.  Work was keeping him busy, he said.  Life was good.  We did the usual, if this time a bit against the clock:  gossiped about friends, reminisced, analyzed current events.  He said he had met Bush’s new Treasury Secretary at an event at the Stock Exchange and was impressed:  the new appointee “seemed to have something going on upstairs, unlike the rest of those Texas yahoos.”
I recounted that I had the previous month met the president when I accompanied a recently arrived Arab Gulf-state ambassador to present his credentials.  In these diplomatic set pieces, which take place two or three times a year, the president sets aside a block of time and the new senior diplomats travel as a group to the White House, where they each have a brief Oval Office meeting, take a picture, and formally present their credentials.
The president was running late that morning.  The tables in the formal holding room were stacked with little rectangular red, white, and blue boxes of peanut M&Ms embossed with the presidential seal.  I pocketed three for my kids.  As we continued to wait, I figured I’d take a few more for the neighbor kids.  Fifteen minutes turned into half an hour.  I took a few additional boxes for the office.
By the time we were finally called in, both my pants and jacket pockets were filled with boxed M&Ms.  I rattled as we walked into the Oval Office.  I was mortified.  Thankfully the president did not seem to notice.
Aaron enjoyed my story but said we had to go:  it was nearly 8:00.
We walked a few blocks to a small performance hall.  I don’t recall its name.  A group of people were gathered outside.  Several were smoking.  It was intermission.
Aaron explained that you could get into the second half of shows for free if you waited outside then joined the audience members as they returned:  no one checked for tickets; all you had to do was look for an empty seat.
That this might not be an appropriate activity for a forty-four-year-old man, particularly one who owned an apartment on Murray Hill, did not seem to be a concern.  
An approaching voice called out Aaron’s name.
We turned.  
Tatjana Someoneovic was a thin, tall woman in her mid-thirties.  Her long black hair was up.  The dangly silver earrings she was wearing, silver suns with smiling faces, nicely complemented her outfit:  jeans, black tank top, vintage floral-pattern jacquard jacket, stylish dark boots.  She had heavily mascaraed greenish Old World eyes.  This was a woman who, while not beautiful, was undeniably sexy.  
Tatjana walked past me and dramatically clasped Aaron to her, taking care not to burn him with her cigarette.
She hugged him close.  
This was noble Penelope welcoming home Odysseus.  
Time passed.  Still they embraced.  She was performing, but for whom?
I began to feel self-conscious.  
The hug continued.  I studied the pavement.
At last, she released him.  Tatjana regarded me.  I looked at Aaron, who said, finally, “This is my friend Scott.”
Tatjana, officially made aware of my presence, did not seem pleased.
“Hello,” she said with a slight accent, offering me her hand and a weak smile.
I said it was nice to meet her.  Noting that Aaron had told me she was a filmmaker, I asked her what she was working on.  
She replied, without discernable affect, that she was directing a short film on Kundera, focusing on his years in Paris as a political exile, then turned to Aaron and began telling him a story about someone they both knew.
A bell rang.  The smokers stubbed out their cigarettes.  People started to make their way back to the theatre entrance.  
“It was good to see you buddy.”  Aaron was happy.
“You too.”
We agreed not to let so much time pass before we saw each other again.  Yes, I would be sure to give his best to Anna and the kids.  Aaron quickly hugged me then ran to catch up with Tatjana, who had joined the line of returning audience members.
I stood alone on the quiet sidewalk.
I was angry as I walked toward Times Square and still angry when I reached the Waldorf.  I had been left to stand there feeling and looking like an idiot during that centuries-long performative hug then essentially dismissed after.  I despise bad manners.  What really pissed me off, though, was that I had triumphed over busy lives to make a visit happen, only to find that my supposed best friend had cut our time short to accommodate a second act sneak with a walking New York cliché. 
As I crossed from Forty-Second Street to Park Avenue, I resolved that if Aaron wanted to meet again, he could fucking be the one to arrange it.
Which he never did.
`;
  const screenplayText = `FADE IN:


TITLE CARD: "Imagination is a terrible thing: you will need to love it, I will teach my son or daughter." — Thomas Lux, "Sailing, Islands"


TITLE CARD: "When there's a missing element that stops us from being able to judge something, and this fact becomes unbearable, the only thing we can do is decide. To overcome doubt, we sometimes have to decide to opt for one side rather than the other. Since you need to believe in one thing, and there are two...you are going to have to choose." — from Anatomy of a Fall


EXT. HIGHWAY - NIGHT

A two-lane road unspools through the dark Virginia foothills. Autumn. The tree line is a black wall against a purple-gray sky.

A single pair of headlights moves south. Steady. Unhurried.

NEIL YOUNG drifts from inside the car — "Harvest Moon," low and plaintive.


INT. SCOTT'S CAR - CONTINUOUS

SCOTT C. THOMPSON, early 60s, sits behind the wheel. Hawaiian-American, broad-shouldered, a diplomat's stillness about him. He is not a man who fidgets. But his jaw is set in a way that costs him something.

The dashboard glow catches his face. He has been driving a long time. He will be driving longer still.

He reaches forward. Turns down the radio. Leaves the road in silence.

SCOTT (V.O.)
When Shoshanna — Aaron's literary agent ex-girlfriend, you'll meet her later — proposed that I write this book, I said no.

A beat. The headlights catch a highway marker. Virginia state line already behind him.

SCOTT (V.O.)
First, I told her: I write clearly but not well. Second, I doubted the story she wanted me to tell — my best friend Aaron killed himself and I tried to understand why — would interest anyone else. Third, it would require me to share personal details of my life and others', which I was loath to do.

He drives. The road curves. The tree line holds.

SCOTT (V.O.)
I've thought a lot about why I finally said yes.

A pause. Long enough to mean something.

SCOTT (V.O.)
Joan Didion observed that we tell ourselves stories in order to live. Her point — I think — is that the impulse to impose order on otherwise chaotic, unmediated experience is basic human nature. What is memory, fundamentally, but the mind's deployment of narrative technique to reorganize personal history into something you can carry?

The car crests a low rise. For a moment, the valley below is visible — dark fields, a cluster of farm lights, a water tower catching the moon.

SCOTT (V.O.)
This process requires a coherent plot. You have to determine: X happened because of Y, which in turn caused Z. People must be defined into characters. There has to be a narrator. A point of view. Judgments must be made.

He exhales slowly. Barely perceptible.

SCOTT (V.O.)
But stories aren't stories until they're told. They require an audience. Even if it's imaginary. Even if it's only one person.

The moon slides behind cloud. The road goes very dark.

SCOTT (V.O.)
I wrote this because telling you the story is what makes it real.

SMASH CUT TO:


INT. ELIOT HALL - SEMINAR ROOM - PORTLAND, OREGON - DAY (1980)

The room is small, overheated. A radiator ticks in the corner like a slow clock. Six or seven students are arranged around a conference table that is too large for the space.

Rain taps at leaded windows from the early 1900s. The light outside is the color of pewter. It is mid-afternoon and already it feels like dusk.

Coats and sweaters have been piled on chairs and radiator pipes. The smell of wet wool is everywhere.

PROFESSOR HUTCHINS, 50s, rumpled and precise in the way of men who have thought carefully about everything except their own appearance, stands at the head of the table. A copy of A Farewell to Arms is open before him.

At the table: BRONWYN KLEIN, 18, dark-eyed, luminously confident in the way of someone who has never seriously doubted her right to take up space. She is lovely and she knows it, which does not diminish her.

GRAHAM GUMM, 19, a second-year student with the permanent expression of someone who expects to be agreed with.

NANCY CHEN, 18, careful and observant, takes notes in a hand so small it is practically a private language.

And SCOTT, 17, sitting slightly apart from the group, not by design but by a kind of instinctive caution. He watches everything.

And AARON SULLIVAN, 18, lean and alert in the way of someone who grew up reading by himself. His clothes are clean but they are not expensive. He is not from where these people are from, and he knows it, and he has decided it does not matter to him. This is not quite true yet but it will be.

PROFESSOR HUTCHINS
What are the literary choices of this narrative opening and what are they trying to accomplish?

He holds up the novel. Its spine is cracked. He has read it many times.

PROFESSOR HUTCHINS (CONT'D)
We've all read the opening paragraphs. Is there a relationship between form and content here, or is it merely — as some have suggested — a stylistic affectation?

BRONWYN
(not waiting to be called on)
I'll say it. It's a masculine wound.

She sets her copy of the novel on the table with a small authoritative click.

BRONWYN (CONT'D)
The spare language, the short sentences, the complete absence of metaphor — it's communicating a kind of woundedness. Poor me. I'm a man, I can't express my emotions. The language performs the repression it claims to lament.

A laugh from around the table.

BRONWYN (CONT'D)
I'll grant there's a music to it. But I'm not terribly moved by it. As a politics, I find it exhausting.

Graham nods immediately, leaning forward as though Bronwyn's observation were a territory he wants to claim.

GRAHAM
It goes further than that. Hemingway's style — and I'm thinking here of Derrida, of the semiotic —

Scott, who has never heard the name Derrida, does not show this. He watches Graham carefully.

GRAHAM (CONT'D)
The point is the futility of language itself. The inability of any words to convey stable meaning. The style doesn't just perform repression — it demonstrates the fundamental impossibility of communication. Which becomes a metaphor for the despair of the Lost Generation.

He sits back. He believes this is decisive.

SCOTT (V.O.)
It wasn't that Graham was wrong. It was that he was missing something I couldn't yet name.

Professor Hutchins makes a note. He neither agrees nor disagrees. He waits.

NANCY
(quietly, reading from her notes)
I keep coming back to the voice itself. The distinctive authorial presence. We had that in Nightwood too — this sense of an intelligence organizing the material even as it pretends not to.

SCOTT (V.O.)
I felt much and said nothing. I was three weeks into my first semester. I would not turn eighteen for another month. I simply didn't have the words.

Scott's hand rests on his copy of the novel. He has underlined things — not passages but single words. His reading is different from the others in a way he cannot yet articulate.

The radiator clunks.

The light shifts.

Then AARON speaks.

AARON
It's not what the language means or doesn't mean.

He says it quietly, but the room attends.

AARON (CONT'D)
It's the language itself.

Bronwyn looks skeptical. Graham's face arranges itself into a sophomore's studied contempt for being challenged by a freshman.

Aaron taps the cover of his book.

The sound in the overheated room — small, definitive.

AARON (CONT'D)
It's what the sentences do.

He finds the page. Reads aloud without looking up:

AARON (CONT'D)
"The pebbles and the riverbed and the leaves on the trees that fell late this year and the troops marching along the roads..."

He looks up.

AARON (CONT'D)
That specificity creates a silence. Not a representation of silence — an actual silence. It allows us, as readers, to hear more clearly everything that, as a result, no longer needs to be said.

A beat.

PROFESSOR HUTCHINS
(genuinely pleased)
That's interesting.

He turns to the room.

PROFESSOR HUTCHINS (CONT'D)
So right from the beginning we're presented with a very distinct authorial voice and a very distinct style. Let's look at how these reinforce each other.

He taps the board.

PROFESSOR HUTCHINS (CONT'D)
Hemingway has built us a house. Let's figure out its architecture.

Graham stares at his notepad. His jaw is tight.

Scott watches Aaron. Something is happening that Scott will not fully understand for years — the precise moment, the exact conversation, from which everything else follows.


INT. ELIOT HALL - CORRIDOR - MOMENTS LATER

The seminar breaks. Students file into the corridor, where it is slightly cooler and smells of old paper and stone.

Graham falls in beside Bronwyn immediately, resuming the conversation as though Aaron had not said anything. Bronwyn is politely half-listening, already reaching for her coat.

Aaron emerges last, pulling on a jacket that is slightly too large in the shoulders.

He sees Scott waiting.

SCOTT
Good seminar.

AARON
You didn't say much.

SCOTT
Neither did you. Until you did.

Aaron looks at him — a quick assessment.

AARON
Coffee?

SCOTT
That's what I was going to ask.


INT. CAMPUS COFFEESHOP - REED COLLEGE - CONTINUOUS

A small, low-ceilinged room. Mismatched chairs. A bulletin board overwhelmed with flyers for lectures, political meetings, a production of Brecht. The windows are fogged with warmth.

An ancient jukebox in the corner plays JOAN BAEZ — "Diamonds and Rust." The sound is slightly warped, as though the record is tired.

Scott and Aaron settle at a corner table with two ceramic mugs. The coffee is dark and slightly burnt and exactly right for the occasion.

SCOTT
That thing about the silence. You're right, you know. It's what I couldn't find the words for.

AARON
Graham was furious.

SCOTT
Graham is always furious when someone else gets there first.

Aaron laughs — genuine, unguarded. It is a good laugh. It will remain one of the best things about him.

AARON
I probably should have let him have it.

SCOTT
No you shouldn't.

AARON
No, I shouldn't.

They drink. A comfortable pause. This is the thing about certain friendships — the silences are comfortable very quickly.

SCOTT
What else are you reading?

AARON
Wallace Stevens. Lately. I keep going back to "The Snow Man."

SCOTT
(shaking his head)
I haven't read Stevens.

AARON
You haven't—

He stops himself. Recalibrates. There is no condescension in it, only genuine surprise.

AARON (CONT'D)
Where are you from?

SCOTT
Hawaii. The Big Island.

A pause in which Aaron clearly does not have a ready context for this and is honest about it.

AARON
I'm from Alabama. Small town. I also haven't read Stevens until about three months ago, so.

Scott exhales — something releasing in him.

SCOTT
Annie Dillard. That's mine.

AARON
Pilgrim at Tinker Creek?

SCOTT
Pilgrim at Tinker Creek.

AARON
Good. That's good.

The jukebox shifts. A different song. Someone has put in a quarter they can't afford.

SCOTT
You grew up in Alabama.

AARON
Latham. You've never heard of it.

SCOTT
Is it on the Big Island?

Aaron stares at him.

SCOTT (CONT'D)
(deadpan)
Neither of us is from anywhere anyone's heard of. That's either a problem or it isn't.

AARON
(quietly)
No, I think it's fine.

They drink.

AARON (CONT'D)
What do you make of Bronwyn?

SCOTT
She's the most confident person I've ever met.

AARON
She's not wrong about Hemingway.

SCOTT
She's not wrong. She's missing something.

AARON
What?

SCOTT
I don't know yet. I'll tell you when I figure it out.

Aaron nods, as though this is a perfectly reasonable thing to say.

AARON
What about Nancy?

SCOTT
(a beat)
She's very methodical. Thorough.

AARON
I find her attractive.

Scott considers this diplomatically.

SCOTT
She seems like a serious person.

AARON
Are you considering rugby?

SCOTT
The signup sheet was on the board.

AARON
I've never played.

SCOTT
Neither have I.

AARON
Do you know the rules?

SCOTT
In outline.

AARON
Which means no.

SCOTT
Which means approximately no.

They both consider this. Two young men from nowhere in particular, agreeing to join something they do not understand.

AARON
I'll sign up if you sign up.

SCOTT
That seems right.

A beat. Scott checks the time. Reluctant.

SCOTT (CONT'D)
I have a class.

He gathers his coat. Stands. Aaron looks up at him — Scott is, in fact, large, and Aaron has to revise slightly his estimate of the distance between them.

AARON
Thanks for suggesting coffee. I was a bit surprised, to tell the truth.

SCOTT
Why?

AARON
Well. You're a big guy. You're a bit intimidating. You don't say much, but when you do, it's really interesting.

Scott waits.

AARON (CONT'D)
I figured you were super smart and didn't like the rest of us.

Scott holds on this for a moment. Then:

SCOTT
I don't know the rest of you well enough yet.

He pulls on his coat. Looks at Aaron once more — a look that is measuring but not unkind.

SCOTT (CONT'D)
Same time Thursday? After seminar?

AARON
Same time Thursday.

Scott nods and goes. Aaron watches him leave. Then he turns back to his coffee, to the foggy window, to the sounds of the campus coffeeshop filling with the particular music of a Friday afternoon in October 1980.

He is eighteen years old. He is a long way from Latham, Alabama. He has just made the most important friend of his life.

He does not know the second part of that sentence yet.


INT. SCOTT'S CAR - NIGHT (PRESENT)

The Virginia darkness. The highway. Neil Young back on the radio, barely audible.

Scott drives with one hand on the wheel. His other hand rests on the passenger seat. There is nothing on the passenger seat.

SCOTT (V.O.)
I was seventeen years old, and I did not yet have the vocabulary to say what I felt in that seminar room when Aaron spoke. I'd had the thought. He found the words. That would be the pattern of a great deal of what followed.

A pause. The headlights reach into the dark and the dark receives them and gives nothing back.

SCOTT (V.O.)
What I said to him was true. I didn't know the rest of them well enough yet to dislike them. But I'd have been lying if I said I felt, that first week, that I belonged at Reed. That I belonged anywhere on the mainland at all.

He adjusts his grip on the wheel. The motion of a man settling in for a long conversation with no one.


INT. ELIOT HALL - SEMINAR ROOM - DAY (1980) - FLASHBACK

The same room. A different week. Coats again piled on the radiator. A different novel on the table — The Great Gatsby, its green light already being discussed.

Bronwyn holds court.

BRONWYN
The Midwest is the wound. The East is the dream. And Gatsby is the American delusion dressed up as the American promise. He is every self-invented man who mistakes reinvention for identity.

GRAHAM
(seizing the opening)
The green light as signifier—

AARON
(not unkindly)
The green light as green light.

Graham turns to Aaron with the look of someone who has been interrupted once too many times.

GRAHAM
You have a problem with theory?

AARON
I have a problem with using theory to not read the book

FADE IN:


INT. SCOTT'S CAR - MOVING - LATE AFTERNOON / DUSK

A rental sedan. The Blue Ridge foothills roll past the windows in the last copper light of a mid-October afternoon. The light is going fast.

Neil Young's "Sugar Mountain" plays low on the stereo. Scott's hands are relaxed on the wheel — the hands of a man who has driven through difficult things before.

SCOTT (V.O.)
Bronwyn wondered once how two people as different as Aaron and I could be close friends. It's a good question. I tried to articulate an answer for a while. Not much time passed before I gave up.

He adjusts the rearview mirror. Nothing behind him but empty road.

SCOTT (V.O.)
We were tuned to the same frequency. That's the best I could do.

A BARN OWL drops from nowhere, sweeps across the headlight beams — raptorial, precise — and vanishes into the treeline.

Scott watches it go.


INT. ELIOT HALL SEMINAR ROOM - REED COLLEGE - DAY (1980)

FLASHBACK. A small, overheated room. Rain on leaded glass. Autumn in Portland.

SCOTT (19, Pacific Islander, watchful, the only person in the room whose clothes clearly came from a discount rack) sits across a seminar table from AARON SULLIVAN (19, lean, Alabama-sharp eyes, the careful stillness of someone who learned early to read a room before speaking).

Between them: a battered paperback copy of THE SUN ALSO RISES.

The room empties after class. They are the last two left.

AARON
You think they made a mistake? Accepting you?

SCOTT
Every single day.

He says it like a joke. It lands like a confession.

AARON
(grabbing Scott's forearm)
I feel the same goddamn thing.

Scott looks at the hand on his arm. Then at Aaron.

AARON (CONT'D)
I feel like this fucking hick from Alabama. Which I kind of am, but still. I have nothing in common with these people.

SCOTT
(carefully)
Where'd you come from?

AARON
Latham.

SCOTT
I don't know it.

AARON
Nobody does. That's the whole point.

A beat. The rain on the glass. The radiator ticking.

SCOTT
Kailua-Kona. Hawaii.

AARON
(taking this in)
So we're both a long way from home.

SCOTT
(quietly)
Yeah. We are.

They sit with that for a moment.


INT. SCOTT'S CAR - MOVING - NIGHT

Full dark now. The headlights carve a tunnel through Virginia trees. Neil Young has given way to something quieter — just road noise and the hum of the engine.

SCOTT (V.O.)
Aaron and I were best friends for many years. And then we weren't. There was no dramatic falling out, no messy divorce. Our lives took different paths. We got busy.

He checks the rearview. Nothing.

SCOTT (V.O.)
I don't know.


INT. SCOTT'S HOME OFFICE - WASHINGTON D.C. - DAY (RECENT PAST)

A tidy room. Framed diplomatic postings on the wall. Scott (now mid-50s, silver at the temples, the composed face of someone who delivers difficult news professionally) stands at his desk holding an opened envelope.

The letterhead: BRADFORD, LINDSTROM & TSAI, LLC. Midtown Manhattan.

He reads. His face does not change. This is a man trained not to let his face change.

He sets the letter down.

He picks it up again.

SCOTT (V.O.)
Jared Ellison of Bradford, Lindstrom and Tsai was writing to inform me that I had been named as the Executor of the Estate of Aaron Sullivan. Aaron, whom I hadn't seen or spoken to in almost two years, was dead.

Scott sits down slowly in his desk chair.

A long beat.


MEMORY SEQUENCE — QUICK CUTS, NO SOUND:

Aaron beside Scott at a wedding altar, grinning in a rented tuxedo.

Aaron, Nate, Jean-Luc, and Scott — younger, looser — in the steam of BAGBY HOT SPRINGS, passing something between them.

Aaron holding a NEWBORN, his face stunned open with something unguarded.

Aaron on the phone, alone in a dark apartment, his voice tight and careful, the aftermath written in every line of his body.


BACK TO:

INT. SCOTT'S HOME OFFICE - WASHINGTON D.C. - DAY (RECENT PAST)

Scott is still holding the letter. He reads the closing paragraph aloud, quietly, to no one.

SCOTT
"Acknowledging that this may be a complex and emotional process, I am here to assist you in fulfilling your executorial duties. Bradford, Lindstrom and Tsai is prepared to guide you through each step."

He sets the letter on the desk.

SCOTT (CONT'D)
(to himself)
Jared Ellison.

He says the name the way you'd say the name of a town you've never been to and don't intend to visit.


INT. SCOTT'S CAR - MOVING - NIGHT

The highway unspools. A billboard for a personal injury lawyer slides past — a man in a suit pointing at the camera, promising results.

SCOTT (V.O.)
Two tourists from Germany, hiking near OK Slip Falls in the Adirondacks, found a neatly folded pile of men's clothes in a clearing overlooking the Hudson. Placed next to it was a pair of hiking boots — socks tucked inside the right shoe — and a phone, a watch, a St. Jerome medal, and Bradford, Lindstrom and Tsai's business card in the left boot.

Another sign. Another billboard lawyer. The geography is changing — the mountains flattening into something more commercial, more indifferent.

SCOTT (V.O.)
The Germans saw no one. They were aware of the implication of the scenic two-hundred-and-fifteen-foot drop. They alerted the police.

He passes under a sodium lamp. His face is briefly lit, then dark again.

SCOTT (V.O.)
The search yielded nothing. The Adirondacks Park Authority ranger told me a few weeks later that they hadn't expected it to. "There's just too much damn river."

A long beat. Just road.

SCOTT (V.O.)
The Hamilton County coroner determined Aaron's death a suicide.


EXT. SCOTT'S CAR - MOVING - CONTINUOUS

The car from outside: a single pair of headlights moving south through total darkness. Small against the trees.

Neil Young again, barely audible through the glass.


INT. STATE DEPARTMENT CAFETERIA - WASHINGTON D.C. - DAY (1997)

Fluorescent light. The ambient hum of bureaucracy at lunch. SCOTT (late 30s, trimmer, the slightly watchful quality of someone recently back from a hardship posting) sits across a cafeteria table from NATE O'BRIEN (late 30s, Boston Irish in the jaw, the eyes of a man who reads everything and forgives nothing).

Nate's Evian bottle is nearly empty. He kills it with a dismissive chug.

NATE
What a nice little capitalist our Aaron has turned into.

He sets the bottle down with the finality of a verdict.

NATE (CONT'D)
Probably getting laid like a bandit, too. Because it's not enough he's making twice what we do.

SCOTT
He seemed good. He's enjoying New York.

NATE
Of course he's enjoying New York. People who are making money and getting laid tend to enjoy things.

Scott smiles. Around them, STATE DEPARTMENT COLLEAGUES navigate trays and conversation.

NATE (CONT'D)
(leaning in, shifting gears)
Alright. You ready? Jean-Luc.

SCOTT
What about him?

NATE
Sommelier. Paris. Sleeping with the labor minister's daughter.

SCOTT
Obviously.

NATE
And — are you ready for this — he irons his jeans.

SCOTT
His jeans.

NATE
His jeans. Someone from French House told me. Irons them. Crease and everything.

SCOTT
That might be a European thing.

NATE
It's an asshole thing. European asshole thing, but still.

A beat. Nate shifts again — the organized presenter preparing his next item.

NATE (CONT'D)
Maria married some real estate developer. New Mexico.

Scott says nothing. He knows this territory requires careful navigation.

NATE (CONT'D)
(casually, performing casualness)
Which, fine. Good for her. I don't care about that.

SCOTT
Of course not.

NATE
I care about Graham Gumm.

SCOTT
(carefully)
Graham is an associate professor at Vanderbilt apparently.

NATE
(a volcano considering its options)
Of course he is.

SCOTT
Jenny ran into him at a Wilson Center symposium. Said he seemed pretty full of himself.

NATE
He was always full of himself. He was full of himself at Reed. He was full of himself in that stupid Talking Heads t-shirt he wore every goddamn day.

SCOTT
(attempting peace)
Once a poser —

NATE
Always a poser. And that's all I have to say about it.

Scott laughs. He glances at his colleagues nearby and laughs again, remembering.

NATE (CONT'D)
(immediately)
What.

SCOTT
Nothing.

NATE
(shark, blood, water)
What.

SCOTT
I was just thinking about that day in English class. With Graham.

NATE
Tell me.

SCOTT
You haven't heard this?

NATE
Tell me everything.

Scott settles back. The story arranging itself.

SCOTT
This was freshman year. First semester. We were doing Hemingway — The Sun Also Rises —

NATE
(already pleased)
Go on.

SCOTT
Graham decided to hold forth. In that way he had. You know the voice.

NATE
(pained recognition)
Oh, I know the voice.

SCOTT
He goes on for about three minutes about what Hemingway really means by the corrida. The deeper symbolism. The wounded masculine and so forth.

NATE
Jesus.

SCOTT
And Aaron just — waited. Let him finish. The whole three minutes.

Nate is leaning forward now.

SCOTT (CONT'D)
Then Aaron, very quietly, just took him apart. Line by line. Primary sources, the Paris Review interview, the Fitzgerald letters. Every single thing Graham said.

NATE
(almost reverent)
Every single thing.

SCOTT
In about ninety seconds.

A beat.

NATE
(exhaling)
God bless him.

SCOTT
Graham's face—

NATE
I can imagine Graham's face.

SCOTT
It was a thing of beauty.

Nate sits back. A man who has just received exactly what he needed.

NATE
That is — that right there — that is a brogasm.

SCOTT
A what?

NATE
(tapping the table, the word arriving fully formed)
A brogasm. That bonding rush. When another guy just absolutely nails it. When he does the thing you wanted to do and couldn't and he does it perfectly and you feel it like —

He searches for the word.

NATE (CONT'D)
Like Jordan from midrange.

SCOTT
(amused)
You're going to write that down, aren't you.

NATE
(already reaching for his notepad)
I'm writing it down right now.

Scott watches him write. Outside the cafeteria windows, Washington goes about its serious business.


INT. SCOTT'S CAR - MOVING - NIGHT

The present. The dark highway. Scott alone with the road and the music and the low hum of forty years.

SCOTT (V.O.)
Aaron and I were best friends for many years. And then we weren't. And now I am driving south through Virginia in the dark to tell his father — a man Aaron hadn't seen since childhood — that his son walked to the edge of a two-hundred-and-fifteen-foot waterfall on a beautiful day and did not walk back.

A long beat. The trees. The road.

SCOTT (V.O.)
I think about that a lot. The beautiful day part.

The headlights find nothing ahead but more road. The car moves on.

FADE TO BLACK.

FADE IN:


INT. SCOTT'S CAR - NIGHT - CONTINUOUS

The moon breaks through cloud cover. Pale light floods the foothills. Scott drives, one hand on the wheel. His face shifts in the lunar wash.

SCOTT (V.O.)
Aaron connected to other people with astonishing naturalness and ease. A waitress. The guy next to him at a baseball game. He'd find something to ask about and listen with total focus, like whatever you said was the most important thing he'd heard all year.

A barn owl lifts from a fence post, crosses the headlights, disappears.

SCOTT (V.O.)
His perceptiveness was charismatic. But I think that same unusual sensitivity made him lonely. I think. Aaron was closer to me than my actual brother.

Beat.

SCOTT (V.O.)
Up until the moment I opened that letter from Bradford, Lindstrom and Tsai last July, I would have categorically dismissed any suggestion he would take his own life. I knew him. He would never deem that an acceptable option.

The road unspools. Dark tree lines. A dead billboard.

SCOTT (V.O.)
Given that he had, in fact, killed himself — I clearly did not know Aaron as well as I thought I had.

Scott's jaw tightens almost imperceptibly. He stares ahead.

SCOTT (V.O.)
In the black expanse of the open road I see him. Naked. Standing on the edge. His feet feel the mineral, granular earth. Sun warm on his skin. Wind from the river moving his hair.

A long beat. The engine hum.

SCOTT (V.O.)
He closes his eyes. Steps forward. The signs in this story are clear. What they signify is not.


INT. BRADFORD, LINDSTROM & TSAI - CONFERENCE ROOM - DAY (FLASHBACK - TWO MONTHS EARLIER)

Floor-to-ceiling glass. The East River in the far distance, a ferry moving upstream under a cloudless August sky.

JARED ELLISON (40s, dark suit, impeccably composed) gestures to the conference table. He moves with the calibrated ease of a man whose entire professional existence depends on appearing untroubled.

Scott (dressed for a New York meeting, tie loosened from the train) takes a seat. Jared sits across from him, a manila folder aligned precisely with the table's edge.

JARED
Again — please accept our condolences for your loss.

SCOTT
Thank you.

Scott looks at the folder. At the window. At the blue sky above Manhattan.

Despite himself, he almost smiles at it.

JARED
Your primary responsibility as executor is to ensure that Aaron's final wishes are fulfilled. The process is straightforward.

He opens the folder. A death certificate with a blue-scalloped border. He slides it aside, passes Scott a copy of the will.

JARED (CONT'D)
First order of business — I'll submit the death certificate and will to Surrogate's Court and file for letters testamentary confirming your legal authority. Since Aaron had no heirs or known creditors, the process should move cleanly.

Scott looks down at the document. Aaron's name in formal typeface. State of New York. Being of sound mind and disposing memory.

JARED (CONT'D)
Once the court issues letters testamentary, you'll notify beneficiaries, secure and inventory the estate, distribute assets, pay any outstanding debts and expenses. We'll publish a Notice to Creditors in the Times. Final step — filing Aaron's personal tax returns in the spring.

He slides a second document across.

JARED (CONT'D)
Upchurch Corrigan Group handles the financial requirements. One of the best accounting firms we work with. You're free to choose your own, of course.

SCOTT
Upchurch Corrigan will be fine.

Scott reads. His eyes move down the page. His expression does not change, but something beneath it shifts — a man absorbing the arithmetic of a life.

SCOTT (V.O.)
Strange to see Aaron's life, or what remained of it, reduced to a series of paperwork tasks.

SCOTT (V.O.)
He made thirteen personal bequests.

Scott turns the page.

SCOTT (V.O.)
He left Sarah five hundred thousand dollars. Bronwyn, Nate, and me each one hundred thousand. Two hundred and fifty thousand in trust for each of our children — to support their advancement in life, including but not limited to higher education, vocational training, or seed capital for a business venture or other meaningful opportunity.

Scott pauses on a line. Something moves behind his eyes.

SCOTT (V.O.)
A hundred thousand in Jean-Luc's name to Médecins Sans Frontières.

He reads further.

SCOTT (V.O.)
Janelle. In recognition of and gratitude for her years of faithful service — fifty thousand. And a hundred-thousand-dollar special needs trust for her son Quincy, who sustained a head wound in 2007 in Iraq and lived semi-independently with her in Queens.

A beat. Scott sets the document on the table. Looks out at the river.

SCOTT (V.O.)
It was Janelle who had dubbed us the Misfits. She'd seen how tight we were and named what she saw. That's what Janelle did — she saw things.

He picks the document back up.

SCOTT (V.O.)
And then — Reed. One point two million to endow a scholarship. To be known as the Aaron Sullivan Memorial Scholarship. Preference given to students from rural areas who demonstrate financial need, academic merit, and a strong commitment to intellectual and creative exploration.

Scott puts the will down again. Quietly.

SCOTT
This doesn't surprise me. Reed was —

He stops. Recalibrates.

SCOTT (CONT'D)
We both received financial aid. We wouldn't have been there without it.

Jared nods carefully. He has heard many sentences that trail off in this room.

Scott looks back out the window at the enormous, indifferent August sky.


INT. SCOTT'S HOME OFFICE - DAY (FLASHBACK - ONE MONTH EARLIER)

A framed page on the wall. Nate O'Brien's byline visible at the top. Inscribed in blue ink in the margin: Aaron schooling Graham Gumm on Hemingway: brogasm!

Scott stands in front of it with his phone to his ear. He is holding it together in the way that Foreign Service officers hold things together — through sheer structural habit.

BRONWYN (V.O.)
(through phone, sharp)
What do you mean Aaron's dead.

Not a question. An accusation.

SCOTT
Bronwyn —

BRONWYN (V.O.)
What happened. Where. Who says. When was this?

Scott lets the blast move through him. He has made these calls before. Consular officer. Ten years of other people's worst days.

SCOTT
I got a letter from his lawyer last week. Jared Ellison at Bradford, Lindstrom and Tsai. Aaron named me executor.

A long beat. The line hisses faintly.

BRONWYN (V.O.)
(quieter, the lawyer briefly gone)
Executor.

SCOTT
He walked to OK Slip Falls. He —

He stops.

SCOTT (CONT'D)
He was found. In the river. The State Police think —

BRONWYN (V.O.)
No.

SCOTT
Bron —

BRONWYN (V.O.)
No. That's not — Aaron wouldn't —

Another silence. Longer. Scott looks at the framed essay page on the wall.

BRONWYN (V.O.)
(barely audible)
Aaron.

Scott waits. He is good at waiting.

SCOTT (V.O.)
Bronwyn mobilized. Nate analyzed. Jean-Luc, whom due to the time change I put off calling until the following day, became coolly philosophical — outward detachment giving him the space to circle his wagons and process the shock.

He turns away from the wall.

SCOTT (V.O.)
I had yet to notify Sarah, Aaron's almost-wife, for whom I had no contact information. None of us had spoken with her in years. This was at Sarah's request.

He sits at his desk. Opens a laptop. Stares at the screen.

SCOTT (V.O.)
Calling Sarah would open old wounds. I dreaded it.


INT. SCOTT'S CAR - NIGHT - CONTINUOUS (PRESENT)

Back on I-81. The foothills have flattened. The road widens. A billboard for a personal injury law firm: HURT? WE FIGHT BACK.

Scott drives. The moon is high now, sharp and white.

SCOTT (V.O.)
Aaron's designation of me as his executor — his intentional involvement of me in his death — has made me second-guess my understanding of the past.

He glances at the framed essay on the passenger seat. He has brought it with him — one of those inexplicable decisions made in the fog of early grief.

SCOTT (V.O.)
Isn't the point of memory to anchor us so we can move forward? I was feeling adrift.

The car crests a small rise. For a moment the road ahead is entirely dark — no headlights coming, no lights behind.

SCOTT (V.O.)
I'd known Aaron for over thirty years. I'd seen him go through some tough times. He was resilient. Had anyone suggested he would one day kill himself, I would have dismissed it with certitude. No way.

Beat.

SCOTT (V.O.)
If I was so wrong about this —

The headlights illuminate a sign: BRISTOL 47 MILES.

SCOTT (V.O.)
— what else have I missed?

He drives. The framed essay page catches a slant of moonlight on the seat beside him. The inscription barely visible: brogasm!

The car moves on into the dark.


FADE TO BLACK.

FADE IN:


INT. BRADFORD, LINDSTROM & TSAI - CONFERENCE ROOM - DAY (FLASHBACK)

A glass-walled room above Midtown. Afternoon light, cold and lateral. SCOTT, 50s, sits across from JARED ELLISON, 40s — precise haircut, immaculate suit, the stillness of a man who has learned to let silence do his work.

Between them: a manila folder. Will documents. A notary stamp.

SCOTT (V.O.)
Aaron was not Gatsby. He didn't want to be rich as much as he was hell bent on not being poor. That's a different story entirely. A more American one.

Jared slides a sheaf of documents across the table. A pen follows.

JARED
These are your duplicate copies. Retain them. Keep good records as you discharge your executorial duties. Any expenses you incur will be reimbursed — travel, meals, incidentals.

Scott takes the pen. Signs. Turns a page. Signs again.

SCOTT (V.O.)
Latham, Alabama. A small town on the outskirts of Birmingham. He never knew his father. His mother died when he was very young. His grandmother raised him. She was, judging from his stories, an emotionally parsimonious piece of work.

Scott reaches the final page. Signs. Sets the pen down.

JARED
Any questions at this point?

SCOTT
Not yet.

JARED
They'll come up as you go along. Don't hesitate.

A beat. Jared reaches into the folder. Produces a plain envelope.

JARED (CONT'D)
Mr. Sullivan asked that I give you this.

He sets it on the table between them with the careful neutrality of a man delivering something he has been careful not to examine.

Scott looks at the envelope. His name in handwriting he recognizes.

SCOTT (V.O.)
The quieter the surface, the darker the water. I didn't like Jared. I noted this with interest.

JARED
I'll give you a moment. I'm just down the hall.

He leaves. The door closes with a precise, expensive click.


INT. BRADFORD, LINDSTROM & TSAI - CONFERENCE ROOM - CONTINUOUS

Scott alone. The envelope in his hands. He turns it over.

He opens it.

A single piece of standard copier paper, folded in thirds. Handwritten. He unfolds it.

SCOTT (V.O.)
The letter was handwritten on a piece of standard copier paper. Dated the previous month.

He reads. We hear Aaron's voice — warm, precise, careful — the voice of a man who chose his words as he chose everything else.

AARON (V.O.)
Scott. How do you start when you don't know how or where to begin? Answer: You just do it. Thank you for taking this on. I've tried to make things as easy as possible for you. Really all you need to do is oversee the process. Let Jared help you. I've worked with him over the last few years —

Scott's jaw tightens slightly. He keeps reading.

AARON (V.O.) (CONT'D)
— and not just on this. He's good at his job. You don't have to like him.

Scott almost laughs. Doesn't.

He folds the letter. Sets it down. Looks out the window at the gray sky above Midtown.

SCOTT (V.O.)
Aaron's clarity and focus, even in college — he definitely had a north star. Money was a means for him, not an end. He thought deeply about things. He didn't buy a lot of stuff.

He picks up the letter again.

SCOTT (V.O.) (CONT'D)
When Jean-Luc called him "our own Gatsby" after the Fortune profile, he meant it as a compliment. Aaron would have accepted it as one. He was polite that way.

He slides the letter back into the envelope.

SCOTT (V.O.) (CONT'D)
But what Gatsby wanted was the green light — the symbolic, the unreachable. What Aaron wanted was simpler and harder: not to be determined by other people's circumstances. To have choices that were actually his.

He tucks the envelope into his breast pocket. Sits for a moment.

SCOTT (V.O.) (CONT'D)
Until Sarah.


INT./EXT. SCOTT'S CAR - I-81 SOUTHBOUND - NIGHT (PRESENT)

The road. The dark. The Blue Ridge has given way without ceremony to something flatter, uglier. Strip malls scroll past on both sides.

Cheap electronics. Fast food. Discount clothing. More fast food. Designer home furnishings in inverted commas. A billboard — enormous, lit — featuring the theatrical face of a personal injury attorney, arms crossed, jaw set, promising justice or at least adequate settlement.

SCOTT (V.O.)
The pleasant two-lane parkway through the wooded foothills had become, without warning, a four-lane highway bordered by everything America produces when it stops paying attention.

Another billboard. Another lawyer. Teeth. A pointing finger. A toll-free number.

SCOTT (V.O.) (CONT'D)
Large billboards featuring the avaricious faces of ambulance-chasing personal injury lawyers interrupted this uninspiring vista at intervals like piles of dog excrement. And I say this as someone who has lived in cities on four continents.

He drives. The car's digital clock reads 10:47 PM.

SCOTT (V.O.) (CONT'D)
I had been on the road six hours. I was nearing the halfway point. I was tired. I was thinking about Sarah.


INT. RUSSIAN RESTAURANT - MIDTOWN EAST - NIGHT (FLASHBACK)

A booth. Low light, red upholstery. The smell of borscht and old wood. The MISFITS at a table — SCOTT, AARON, BRONWYN KLEIN, NATE O'BRIEN, JEAN-LUCA FOURNIER. Late nineties, by the clothes.

Aaron at ease. Bronwyn leaning forward. Everyone slightly more alive than usual, which is what Aaron did to a room.

BRONWYN
So Jean-Luc called you Gatsby in print. How does that sit?

AARON
Flatteringly. He's wrong, but flatteringly.

JEAN-LUC
(lifting his wine glass)
The parallel is structural. The self-reinvention. The —

AARON
Gatsby wanted Daisy. Daisy was a symbol. What I wanted was a checking account with a number in it that didn't make me feel sick.

NATE
That's the least romantic origin story I've ever heard.

AARON
Good.

Laughter around the table. Aaron smiling. Present.

SCOTT (V.O.)
He was so alive then. Or we were. Or we thought he was because we were. One of those.

Scott watches Aaron across the table. Something private in his face.

SCOTT (V.O.) (CONT'D)
The irony of course is that he did find his Daisy. He just called her Sarah.


INT. SCOTT'S CAR - I-81 SOUTHBOUND - NIGHT (PRESENT)

Scott drives. Exit signs pass. The strip malls thin. Darkness reasserts itself.

He reaches into the passenger seat. His hand finds the envelope. Rests on it.

SCOTT (V.O.)
His chronic, ruminating grief over Sarah turned from romantic loss into magical thinking. If only she would return. She was The One. He should have just grown up. I say that with love, and I said it to him, and he smiled and said I was probably right, and then went on doing exactly what he'd been doing.

He takes his hand off the envelope.

SCOTT (V.O.) (CONT'D)
Some people you can't help move.

A gas station. Scott slows, pulls off.


EXT. GAS STATION - I-81 - NIGHT

Scott gets out. Stretches. The night air is cool, with a smell of diesel and cut grass. He looks up: actual stars, visible now that the strip mall light has fallen back.

He pumps gas. Watches the numbers turn.

SCOTT (V.O.)
The bequest to the monastery surprised me. As best I could remember, Aaron had never been particularly religious. His Catholic grandmother had taken him to mass every Sunday. My sense was that he'd left all of that in Latham when he went to Reed.

He replaces the nozzle. Looks at the stars.

SCOTT (V.O.) (CONT'D)
Perhaps that had changed. Aaron was a seeker. The nonsecular mattered to him — he just didn't advertise it.

He gets back in the car.


INT. SCOTT'S CAR - GAS STATION - CONTINUOUS

Scott sits without starting the engine. He opens the envelope again. Unfolds the letter. Reads by the gas station light.

AARON (V.O.)
There are a few people I need you to see in person. Not call. See. Isaiah Davis is one of them. The address is in the file. I know this is a lot to ask. I'm asking anyway. You always showed up, Scott. I counted on that more than you know.

Scott stares at the page.

SCOTT (V.O.)
Isaiah Davis. Aaron's father. A man Aaron had never met. A man who existed, in Aaron's life, only as an absence so complete it had the weight and shape of a presence.

He refolds the letter. Replaces it. Starts the car.

SCOTT (V.O.) (CONT'D)
Bristol was forty-seven miles.

He pulls onto the ramp. The highway opens ahead.

SCOTT (V.O.) (CONT'D)
I was tired. Aaron was asking me to drive into Alabama and tell a stranger that the son he abandoned had just walked into the Hudson River. I was going to do it. Of course I was going to do it. That was the deal.

A pause. The dark road.

SCOTT (V.O.) (CONT'D)
I just wished I knew why.

The car moves on. The Latham Public Library bequest surfaces unbidden:


INT. REED COLLEGE - DINING HALL - EVENING (FLASHBACK)

The Misfits at dinner. Bronwyn has just said something about the New York Public Library — a childhood event, a Broadway cast, marble lions.

AARON
Must have been nice.

BRONWYN
Surely you had libraries where you grew up.

AARON
Yes. More modest facilities. Humbler public entertainments. And not guarded by marble lions.

Bronwyn gives him the finger.

AARON (CONT'D)
(ignoring her, something warming in his voice)
I loved going to the library. Eight blocks from our house. On the way to school. I would sit there for hours. Summer especially — they had air conditioning.

NATE
Every Saturday?

AARON
After cartoons. Sometimes there were programs. Puppet shows. A scavenger hunt. The Yankee Magician was a repeat performer. We cracked up at the way he talked.

He smiles at some private memory.

AARON (CONT'D)
It smelled like humidity and books and wood polish. No windows. Dark inside. Almost like our church. It felt like a sanctuary.

Scott watches him. The same private look from the Russian restaurant. Recording.

AARON (CONT'D)
Miss Dottie was the librarian. Her assistant, Mr. Drew, was a friend of my Uncle Whitman. They must have seen something in me. They suggested books. The Three Musketeers. Tom Sawyer. Hardy Boys. Then Mockingbird. Fahrenheit 451. Eventually Dickens. Catcher in the Rye — Mr. Drew made me promise not to tell anyone he'd recommended that one.

BRONWYN
(quietly, the anthropology dropped)
They knew what you needed.

AARON
They knew I didn't come from much. When I graduated, they gave me fifty dollars and a fountain pen.

He pauses.

AARON (CONT'D)
I still use it.

A beat at the table. Even Nate says nothing.

SCOTT (V.O.)
It's easy to forget, as an adult, how important it is for kids to feel seen.


INT. SCOTT'S CAR - I-81 SOUTHBOUND - NIGHT (PRESENT)

Scott drives. The Blue Ridge, invisible now, somewhere to the east. The framed essay page on the passenger seat, moonlit.

SCOTT (V.O.)
Fifty thousand dollars to the Latham Public Library, in furtherance of its mission to provide cultural and literary resources in historically underserved rural areas.

He drives.

SCOTT (V.O.) (CONT'D)
Miss Dottie. Mr. Drew. Aaron Sullivan, age seventeen, a fifty-dollar bill and a fountain pen and a road north.

A sign appears at the edge of the headlights: BRISTOL 12 MILES.

Scott exhales. Long and slow.

SCOTT (V.O.) (CONT'D)
He didn't leave that library behind. He carried it.

He reaches over and rests his hand on the framed essay page without looking at it.

SCOTT (V.O.) (CONT'D)
Just like I'm carrying you.

He drives on.

FADE TO BLACK.

FADE IN:


INT. AARON'S APARTMENT - FOYER - DAY

Scott steps inside. Ashleigh, 30s, clipboard under her arm, follows.

Scott flicks on the foyer light. A small stack of mail on the floor. He picks it up, sorts through it — junk — drops it in a recycling box positioned precisely beside the door.

He goes still for a moment. His hand rests on the doorframe.

SCOTT (V.O.)
Aaron loved living here. He'd taken his time choosing it. Post-Sarah. He wanted a place with character. Something that would feel like home.


INT. AARON'S APARTMENT - LIVING ROOM - CONTINUOUS

Scott crosses into the living room. Natural light floods in through bay windows. Treetops press against the glass — a red maple, leaves just beginning to turn.

The room is clean. Ordered. Quiet in the way that belongs to no one anymore.

SCOTT (V.O.)
Standing in his living room, it didn't feel like an invasion. It felt like we'd entered a crime scene.

Ashleigh sets her clipboard on the coffee table. Packing materials, boxes, a roll of garbage bags — already positioned there by someone. Scott notices this.

SCOTT
Someone's been here already.

ASHLEIGH
The firm needed to secure the property. Standard procedure.

A beat. Scott looks at the room — really looks at it.

ASHLEIGH (CONT'D)
As executor, you'll determine disposition for all personal effects. Furniture and appliances through the estate sale, assuming you approve that option. Anything of sentimental value —

SCOTT
I know the process.

He walks to the center of the room. His feet find the carpet — a Qashqai, deep reds and indigos, Turkish.

He takes out his phone. Types.


INSERT — PHONE SCREEN:

Scott W.: At Aaron's. Not to be ghoulish, but do you want the Qashqai?

Bronwyn K.: I understand. Yes.

Scott W.: On it.

Bronwyn K.: Thanks. How's it going up there?

Scott W.: As expected. Weird.


BACK TO SCENE:

Scott pockets the phone. He looks at the bar cart in the corner — opened bottles of whiskey, a half-empty wine. At the stack of old magazines fanned across the coffee table.

SCOTT
The magazines. Recycle. The liquor — dispose of it. Furniture goes in the estate sale.

ASHLEIGH
The carpet?

SCOTT
Spoken for.

Ashleigh makes a note.

SCOTT (V.O.)
I was dismayed at the thought of acquisitive strangers milling around my friend's home. Handling his things. Indifferent to everything they meant.


INT. AARON'S APARTMENT - KITCHEN - DAY

Scott opens the refrigerator. Condiments. Beer. Butter. A jar of dill pickles. Half a jug of orange juice. He closes it.

He opens the freezer. Frozen vegetables. Bacon. Coffee. A tub of vanilla ice cream.

SCOTT
She can handle this.

ASHLEIGH
I'll arrange disposal of all perishables.

Scott opens a cabinet. Plates. Bowls. A single mug on the hook. He touches its handle briefly, then lets it go.

SCOTT
Dishes, silverware, appliances — Goodwill. Or the estate sale. Doesn't matter.

Ashleigh is writing. She pauses.

ASHLEIGH
I know this is unprofessional —

She looks toward the windowsill. Two small houseplants. African violets, struggling a little toward the light.

ASHLEIGH (CONT'D)
Could I take those? I just hate to throw away living things.

Scott looks at them. Something crosses his face — not quite a smile.

SCOTT
Take anything like that you want.

He turns back to the empty refrigerator. He is very tired.


INT. AARON'S APARTMENT - STAIRCASE HALLWAY - DAY

Scott and Ashleigh move up the narrow stairs. Scott slows at the landing.

Two recessed bookshelves — one at the head of the stairs, one running the length of the hallway. A few hundred books. Paperbacks and hardcovers mixed without system. Philosophy beside poetry beside thick European novels.

Scott runs his fingers along the spines. Stops at a small cluster of titles he recognizes.

SCOTT (V.O.)
Aaron's literary taste was broad and eclectic. He liked everything — nonfiction, poetry, philosophy. The classic European novels especially. We differed here. I read deeply rather than widely. A completist. If I liked a writer I tried to read all of their work. This limited my horizons. Aaron had no such limitation.

He doesn't take any of them. He moves on.


INT. AARON'S APARTMENT - BEDROOM - DAY

The bed is made. Hospital corners. The nightstand holds a single pair of reading glasses — folded, placed deliberately at the center of the surface.

On the wall: a large framed landscape. Mountains dissolving into dark clouds. Trees bent sideways by a wind you can almost hear. Turner-esque but not Turner — the painter's name in the corner means nothing to Scott.

He studies it for a moment.

SCOTT
Find out if this is worth anything. Any of the art in the apartment. If it is, auction it and return the proceeds to the estate.

ASHLEIGH
And if it isn't?

SCOTT
Estate sale.

He opens the nightstand drawer. Looks in. Condoms. Lube. Two pens. A sleep mask. A prescription bottle of Ambien. A sudoku book, spine cracked. Packets of lens wipes. A quarter. Nail clippers.

He takes the condoms, the lube, the Ambien, the sleep mask — drops them in the garbage bag without comment.

SCOTT
The rest of it — however you see fit.

He steps back from the bed.

SCOTT (V.O.)
I did not like this forced proximity to the biologically intimate details of Aaron's life. Did not like standing over the bed where my friend had slept and made love. It was invasive. Not my business. Like being compelled to watch another man defecate.

He turns away from the nightstand. His eyes go back to the painting.

The storm in it. The bent trees.


INT. AARON'S APARTMENT - BEDROOM CLOSET - DAY

Scott slides the closet door open. Suits. Dress shirts in dry-cleaning bags. Good shoes in a row on the floor.

SCOTT
His professional clothing. The suits, the shoes. There are organizations that provide business attire to men who can't afford appropriate clothes for job interviews.

ASHLEIGH
I know a few. Good ones.

SCOTT
Aaron would have liked that. Do it that way.

Ashleigh writes. Scott looks at a shelf above the hanging clothes. Folded t-shirts. A stack of worn flannel.

He reaches out and touches the sleeve of a flannel shirt. He does not smell it. He does not pick it up. But his hand stays there for a moment.

SCOTT
The rest to Goodwill.

He slides the door closed.


INT. AARON'S APARTMENT - BATHROOM - DAY

Small. Clean. Scott opens the medicine cabinet.

Four prescription pill bottles. He picks up the first, reads the label, sets it down. Picks up the second.

SCOTT (V.O.)
The bathroom was pretty much as you might expect.

He sets the second bottle down. He doesn't reach for the third or fourth.

He stands there looking at the four bottles lined up on the glass shelf and does not move for a long moment.

Ashleigh waits in the doorway. She doesn't ask.

FADE TO BLACK.

CONTINUING FROM PREVIOUS SCENE:

INT. AARON'S APARTMENT - STUDY - DAY

Scott sits at the Ethan Allen desk, Ashleigh standing nearby with her clipboard. He looks up at the three framed album covers between the windows — Kind of Blue, A Love Supreme, Hejira.

SCOTT (V.O.)
Unlike the other rooms, Aaron's study felt lived in. It reflected his personality. The rest of the apartment had the curated impersonality of a hotel room. This one was still his.

Scott scans the wall. University of Alabama diploma. A Miró print. A framed photo of Aaron flanked by Bill and Hillary Clinton. A clock.

On the desk: five sealed envelopes, arranged with precision. A Weeping Fig in a blue-and-white porcelain pot.

ASHLEIGH
The personal items — the letter he left you — you can take that now. You're not officially appointed yet, but since these have no monetary value...

Scott looks at her for a beat.

SCOTT (V.O.)
For some inexplicable reason, this annoyed me.

He sits. He pulls one of the envelopes toward him, then stops.

SCOTT (V.O.)
Aaron had planned this. The apartment that had once been his home now had the feel of something staged. He had carefully minimized the burden of my executorial duties. If he had had the mental fortitude to do that — to think it all through, step by step — how could he have not figured out a way to seek help?

He opens the pencil drawer. Paper clips, pens, envelopes, stamps. Nothing.

He opens the upper file drawer. Financial documents. He glances at them and closes the drawer.

SCOTT
These should go to Bradford, Lindstrom. The financial side is theirs.

ASHLEIGH
(making a note)
Of course.

He opens the lower file drawer. Finds a document in a folder. He reads it. His expression shifts — not shock, but something quieter.

SCOTT (V.O.)
Aaron's Certificate of Reception into Full Communion with the Catholic Church. Dated two years previous. Well. There's one question answered.

He sets it down, looks out the window.

EXT. MURRAY HILL - WINDOW VIEW - DAY (SCOTT'S POV)

A murmuration of starlings rises from a rooftop, drops sharply, and wheels away into blue distance.

INT. AARON'S APARTMENT - STUDY - DAY

Scott watches them go.

SCOTT (V.O.)
Aaron converting still seemed so out of character. I remembered the Catholic conversations — Aaron, Nate, Jean-Luc, for what felt like hours, trading memories of interminable masses, hypocritical nuns, and drunk priests. Protestant me listening in perplexed wonder. They recalled the nunial torture with a special fondness I found genuinely baffling.

FLASH TO:

INT. REED COLLEGE - COMMON ROOM - NIGHT (1982)

A small overheated room. Rain on leaded glass. Four young men: SCOTT, AARON, NATE, JEAN-LUC. Beer cans. A circle of lamplight.

AARON
My grandmother was deeply troubled by the possibility I would be deprived of the beatific vision — seeing God in heaven — should I die without being baptized.

JEAN-LUC
(mock horror)
Dieu ne plaise.

AARON
Given to understand by the parish priest that a public baptism for the child of an unwed mother was canonically permissible but socially "delicate" —

NATE
Socially delicate. That's one way to put it.

AARON
— she struck a deal. She wouldn't insist on a public baptism if he'd confer the sacrament informally. He agreed. She invited him to lunch. No witnesses. He baptized me.

NATE
Were you confirmed?

AARON
A parish-blessed public profession of faith would have been a bridge too far. Especially after the informal baptism. The priest told her there would be no parish record. But that God would see.

A beat. Jean-Luc lifts his beer in a small, sardonic toast.

BACK TO:

INT. AARON'S APARTMENT - STUDY - DAY

Scott puts the certificate back in the folder.

He reaches into the bottom drawer. Among the tissues and computer cleaning supplies, he finds a thin blue leatherette photo album. Gold lettering on the cover: YOUR LIFE — already beginning to peel.

He opens it. Baby pictures. Black and white. A boy at various ages. Grandmother's handwriting in pen and pencil. I've Arrived! Baby's First... Time of birth. Delivery weight.

Scott looks at it for a long moment.

He places it carefully in his satchel.

He turns to the credenza behind the desk. And stops.

On the shelf, among other vintage lunchboxes, sits a tin Starsky and Hutch lunchbox. The bright red Gran Torino with its white vector stripe.

SCOTT (V.O.)
I knew that lunchbox.

He reaches for it.

SCOTT (V.O.)
He'd found it at a thrift store sophomore year. He'd used it to stash his drug paraphernalia. Seeing it had sparked a whole afternoon of elementary school memories. He told me he'd had the exact same lunchbox as a kid. Mine was Steve Austin — the Six Million Dollar Man — which was cool because we had the same name. We remembered how you had to be careful not to break the glass in the thermos, which of course you always ended up doing anyway.

Scott carries the lunchbox to the desk and sits. He looks at Ashleigh. She watches, clipboard to her chest.

He lifts the small latch.

Inside: objects. Small, personal. A St. Jerome medal. Arrowheads. A Springsteen ticket stub. A Vermont snow globe — but with fall leaves instead of snow.

Scott looks at them. He does not touch them yet.

SCOTT (V.O.)
It was filled with items of profound personal importance. I felt an overwhelming sadness. This was the precious detritus of my best friend's life. It moved me that he had wanted me to see these things — otherwise he would have thrown the box out. But what was I going to do with it?

He closes the lunchbox gently. Sets it beside the satchel.

SCOTT (V.O.)
That would be for another time. Today was about getting the business done.

He stands. Surveys the bookshelves.

SCOTT (V.O.)
The books could be sold — but there were likely some valuable first editions and The Strand would know what to do with them.

His eye moves across the spines. He stops at one. Pulls it down.

Fear of Flying.

SCOTT (V.O.)
We all agreed that the book had a certain cultural value — it captured the Seventies feminist moment just as On the Road captured the Beat Generation. We also all agreed the writing was atrocious and the plot risible.

He smiles.

SCOTT (V.O.)
Aaron used to tease Bronwyn about it mercilessly. Accusing her of complicity in a literary crime. She'd defend it in sisterly solidarity even though she secretly agreed with every word.

He laughs — out loud, sudden, real. Ashleigh looks up from her clipboard.

He holds the book up briefly, as if showing it to someone who isn't there, and puts it in the satchel.

He finds Paterson. He finds Absalom, Absalom.

Then he slows. He scans with focus now. Looking for something specific.

He finds it.

A signed first edition of The Bluest Eye, Toni Morrison's first novel. He pulls it from the shelf. On the cover: a Post-It note.

He reads it.

SCOTT (V.O.)
"I win."

He stands there holding the book.

SCOTT (V.O.)
He had spent years reminding me of this book. Years. And I had spent years coveting it. And here it was, with a Post-It note telling me so.

He shakes his head slowly.

SCOTT (V.O.)
You won, alright. How could it be that this beautiful man was gone?

He sets the book in the satchel. Then, with quiet determination, locates The Electric Kool-Aid Acid Test. Then Portnoy's Complaint — the dust jacket perfectly intact.

SCOTT
(to himself)
Who's the winner now.

He looks at Ashleigh.

SCOTT
I think we've covered it.

ASHLEIGH
(genuine)
I'll type everything up and submit it for your formal approval once you're appointed.

SCOTT
Thank you. For your help today.

ASHLEIGH
Do you need someone to help you to Penn Station?

SCOTT
No. I'm fine.

He picks up the satchel. He picks up the lunchbox. He looks around the study one last time. The three album covers. The Weeping Fig. The empty desk.

He walks out.

INT. AMTRAK TRAIN - DAY

Scott in a window seat. The train moving. New Jersey industrial corridor sliding past.

He pulls down the tray table. Sets the Starsky and Hutch lunchbox on it.

The MAN in the seat beside him — roughly Scott's age, Wall Street Journal open — glances over. Chuckles.

MAN
That certainly takes you back, doesn't it.

SCOTT
It sure does.

The man smiles and returns to his paper.

Across the aisle, a small BOY — maybe seven — stares openly at the lunchbox, transfixed by the Gran Torino and its white vector stripe.

Scott catches the boy's eye. He lifts the latch.

SCOTT (V.O.)
I opened Aaron's lunchbox as the train pulled out of Trenton. I was right that others would notice it.

He looks down at the contents. The St. Jerome medal. The arrowheads. The snow globe with fall leaves. The ticket stub.

The boy across the aisle leans slightly into the aisle, trying to see.

Scott sits quietly with the open box in the moving train, the afternoon light coming gray through the window.

He does not move for a long moment.

FADE TO BLACK.

FADE IN:

INT. AMTRAK TRAIN - CONTINUOUS

Scott lifts the bound stack of aerogrammes from the lunchbox. The red-and-black PAR AVION stripes are visible even from a distance. He thumbs through them slowly.

SCOTT (V.O.)
The aerogrammes. I'd written them from Morocco. Peace Corps. Twenty-three years old and complaining, apparently, about the carnal challenges of conservative Arab village life.

He almost smiles.

SCOTT (V.O.)
Aaron mailed me a copy of Playboy. God only knows how it got past the postal censors.

He sets the aerogrammes aside. Pulls out the envelope of photographs.

He goes through them one by one. His wedding. Nate and Sophia cutting a cake. The four of them — Aaron, Nate, Jean-Luc, Scott — clowning in what looks like a dorm hallway, young and foolish and entirely alive.

Then: a young Bronwyn giving the camera the finger.

Scott lets out a short, quiet breath. Not quite a laugh. Not quite not.

More photographs. Aaron and Sarah. Formal, radiant, young. Then another. Then another.

He pauses on the baby photo. He turns it over. Nothing written on the back.

He turns it face up again. Studies it.

Then the last photograph. Black-and-white. A high school yearbook portrait. A young woman with careful eyes.

He turns it over.

SCOTT (V.O.)
Mary-Rose Sullivan, 1962. Written in careful cursive on the back. Aaron's mother. She would have been — I worked it out — eighteen.

He sets the photograph face-up on his knee and looks at it for a moment before placing it back.

He pulls out the yellowed newspaper clipping. THE QUEST. Reed's student paper. A small headline about a rugby match. Whitman College. Walla Walla. Fall of 1981.

A grainy team photograph. A row of young men, some grinning, some trying to look serious.

Scott finds himself in it immediately. Then Aaron.

SCOTT (V.O.)
My sons are almost the age we were then.

He stares at it.

SCOTT (V.O.)
That was a great game. Second half, I intercepted a Whitman pass. Stunned that I had the ball — it was usually the backs — I ran like hell. Scored my first and only try. Aaron scored one too. He was a winger. Much better player than me.

The boy across the aisle has woken and is watching with mild curiosity. Scott doesn't notice.

Scott finds something else in the lunchbox. He holds it up.

A pipe. A small bag of weed.

He looks at it. Looks around. Quietly slides both under the stack of letters.

SCOTT (V.O.)
Once a stash box, always a stash box.

He reaches in again. The Vermont snow globe. He shakes it once. Tiny fall leaves — red, orange, yellow — swirl around miniature trees.

He watches them settle.

Then a scrap of paper. Handwritten. He reads it.

SCOTT (V.O.)
A stanza from an E.E. Cummings poem. The one with that line about the wonder that keeps the stars apart. I didn't recognize the handwriting.

He looks at it a moment longer. Sets it down.

The Springsteen ticket stub. Two arrowheads. A black fountain pen. A Latham Public Library card. A key. Two foreign coins — one with Cyrillic. A chunk of silver-grey rock with red running through it.

Scott holds the library card for a long beat.

SCOTT (V.O.)
I thought about reading the letters I'd written from Morocco. In my emotionally depleted state I couldn't bear the thought of confronting the unformed doofus that was the twenty-three-year-old me.

He looks out the window. Fields. Towns. The gray afternoon light.

SCOTT (V.O.)
I wondered who had given Aaron the Cummings poem. And why he'd kept it.

Music arrives: Bob Seger. "Night Moves." The last verse, barely audible — the instrumentation dropping away, just voice.

SCOTT (V.O.)
Strange how the night moves. With autumn closing in.

The boy across the aisle is asleep again. Newspaper folded on his lap.

Scott closes his eyes.

CUT TO:

EXT. I-81 SOUTHBOUND - DUSK

The rental car moving through the Blue Ridge foothills. The light has gone amber and low, dropping fast. Billboard lawyers fly past. An ambulance-chasing firm with a 1-800 number in four-foot letters.

SCOTT (V.O.)
Bristol. Half-way between Arlington and Birmingham. A railway town in either Virginia or Tennessee, depending which side of the main street you're standing on. The state line runs right down the middle.

CUT TO:

INT. BRISTOL HOTEL ROOM - NIGHT

Spare. Over-laundered sheets. Scott sits on the edge of the bed in his undershirt, tie loosened, shoes off.

SCOTT (V.O.)
Simply for the satisfaction of having made it to a different state, I stayed on the Tennessee side. This drive has reinforced my awareness that I live conceptually and physically inside the Washington beltway. I keep forgetting how big this country is.

He stares at the wall.

SCOTT (V.O.)
Waiting for sleep, I thought about the last time I saw Aaron one-on-one.

MATCH CUT TO:

EXT. MIDTOWN EAST, NEW YORK CITY - NIGHT (2006)

Establishing. September. UNGA season. The streets carry that particular New York energy — foreign-plated motorcades, suited aides moving in clusters, the whole city briefly cosmopolitan beyond even its usual self.

Scott, fifteen years younger, walks with purpose. Well-dressed, slightly stiff. A diplomat on leave from duty.

SCOTT (V.O.)
Late September 2006. UNGA. I'd finagled a two-day working trip — note-taker for two bilateral meetings. Finished by three. Had the afternoon to myself. We met in Midtown East. A Russian place Aaron liked.

INT. RUSSIAN RESTAURANT, MIDTOWN EAST - NIGHT (2006)

Small. Dark wood. A candle on the table. AARON sits across from Scott. He is warm, present, energized. There is something slightly dialed-up about him — a brightness that reads either as happiness or performance. It is hard to say which.

AARON
You met Bush?

SCOTT
Accompanied the new Gulf-state ambassador. Credentials ceremony. Very formal, very brief.

AARON
And?

SCOTT
I'd been waiting in the holding room for forty-five minutes. They had these little boxes of M&Ms. Presidential seal on the box.

Aaron leans in, already smiling.

SCOTT (CONT'D)
I took three for my kids. Then I thought about the neighbor kids. Then fifteen minutes became thirty. I took a few more for the office.

AARON
How many boxes.

SCOTT
By the time they called us in, both pockets. Jacket and pants. I rattled as we walked into the Oval Office.

Aaron laughs — a real one, full, unguarded. It changes his whole face.

AARON
You rattled.

SCOTT
Like a goddamn maraca. He didn't seem to notice.

AARON
Or was too polite to say anything.

SCOTT
Diplomatic courtesy. Goes both ways.

They're both laughing now. Then it settles. Aaron checks his watch. A small, involuntary gesture. Scott catches it.

SCOTT (CONT'D)
You have to be somewhere.

AARON
I have to leave by eight. I'm sorry. I should have said when we set this up. There's someone I'm meeting after — a filmmaker. She's been in town for —

SCOTT
No. It's fine.

A beat. It is not entirely fine.

AARON
There's still time. Tell me about the kids.

SCOTT
They're good. They're growing. Ben has his mother's discipline and my stubbornness which is — a specific combination.

AARON
God help you.

SCOTT
God help Anna.

Aaron smiles. He is fully present for one more moment. Then somewhere behind his eyes, almost imperceptibly, something shifts.

CUT TO:

EXT. SMALL PERFORMANCE HALL, MIDTOWN EAST - NIGHT (2006)

A modest marquee. A crowd gathered outside on the sidewalk. Intermission. Several people smoking. The hum of a city evening.

Scott stands next to Aaron. Aaron is scanning the crowd.

SCOTT (V.O.)
He explained that you could get into the second half of shows for free. Wait outside at intermission, then join the audience members returning. No one checks for tickets. Just look for an empty seat.

SCOTT
You realize you own an apartment on Murray Hill.

AARON
It's a good system. I've been doing it for years.

AARON
(quietly)
There she is.

A VOICE from across the small crowd.

VOICE (O.S.)
Aaron!

They turn. TATJANA SOMEONEOVIC — mid-thirties, tall, thin. Long black hair up. Dangly silver earrings, sun-shaped, smiling faces. Jeans, black tank top, vintage floral jacquard jacket. Dark boots. A cigarette between two fingers.

She is not beautiful. She is entirely, deliberately magnetic.

She walks directly to Aaron — past Scott as though he is part of the architectural landscape — and clasps Aaron to her. The cigarette goes up and away from his back. Her eyes close.

Scott stands eighteen inches away.

Time passes.

The hug continues.

Scott looks at the pavement. At the marquee. At the pavement again.

The hug continues.

At last she releases him. She steps back and takes a long look at Aaron's face, as though confirming something.

Then she turns. Regards Scott.

A beat in which Scott's existence is officially acknowledged.

AARON
This is my friend Scott.

TATJANA
(slight accent, slight smile)
Hello.

She extends her hand. Scott takes it.

SCOTT
Nice to meet you. Aaron mentioned you're working on a film.

TATJANA
Yes. Kundera. His exile years in Paris.

SCOTT
That sounds —

But she has already turned back to Aaron and begun telling him a story about someone they both know. The story has names, details, a rhythm. It is clearly not for Scott.

A BELL rings. The smokers stub out cigarettes. People begin moving back toward the entrance.

Aaron hugs Scott quickly. Warm, brief.

AARON
Good to see you, buddy.

SCOTT
You too.

AARON
Don't let so much time pass. Give my love to Anna and the kids.

Aaron catches up with Tatjana, who has already joined the line of returning audience members. He falls in beside her. Within three steps they have folded into the crowd.

Scott stands alone on the quiet sidewalk.

He watches them go.

SCOTT (V.O.)
I was angry as I walked toward Times Square. Still angry when I reached the Waldorf. I had triumphed over busy lives to make a visit happen. My supposed best friend had cut our time short to accommodate a second-act sneak with a walking New York cliché.

A long beat. He doesn't move.

SCOTT (V.O.)
As I crossed Forty-Second Street to Park Avenue, I resolved that if Aaron wanted to meet again, he could be the one to arrange it.

He turns and walks away from the theatre. Alone. His figure diminishing down the sidewalk.

SCOTT (V.O.)
Which he never did.

MATCH CUT TO:

INT. BRISTOL HOTEL ROOM - NIGHT

Scott. Same position on the edge of the bed. The room unchanged.

He sits with the silence for a moment.

Then he lies back on the over-laundered sheets, fully dressed, and stares at the ceiling.

FADE TO BLACK.`;

  // Match whatever you actually picked in FluidScriptr's conversion settings —
  // this changes how omissions and mappings get judged. See prompts.js for
  // the exact option strings recognized (FORMAT_GUIDANCE / APPROACH_GUIDANCE /
  // TONE_GUIDANCE / DIALOGUE_STYLE_GUIDANCE).
  const conversionSettings = {
    targetFormat: "Short Film",       // "Feature Film" | "Limited Series" | "TV Pilot" | "Short Film"
    adaptationApproach: "Compress",   // "Compress" | "Select Best" | "Faithful"
    tone: "Faithful to source",       // "Faithful to source" | "Cinematic / visual-first" | "Compressed / tight pacing" | "Expanded with subtext"
    dialogueStyle: "Naturalistic",    // "Naturalistic" | "Stylized / Literary" | "Minimal — let visuals carry" | "Heavy subtext"
  };

  console.log("Running structural + omission extraction...");
  const sp = buildStructuralAndOmissionPrompt(manuscriptText, screenplayText, conversionSettings);
  const structuralOmissionResult = await callClaude(sp.system, sp.user);
  console.log(JSON.stringify(structuralOmissionResult, null, 2));

  console.log("\nRunning dialogue extraction...");
  const dp = buildDialoguePrompt(manuscriptText, screenplayText, conversionSettings);
  const dialogueResult = await callClaude(dp.system, dp.user);
  console.log(JSON.stringify(dialogueResult, null, 2));

  console.log("\nComputed scores:");
  const scores = computeFidelityScores(structuralOmissionResult, dialogueResult);
  console.log(scores);
}

main().catch(console.error);
