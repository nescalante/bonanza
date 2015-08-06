'use strict';

var list = ['Homer Simpson','Marge Simpson','Bart Simpson','Lisa Simpson','Maggie Simpson','Akira','Ms. Albright','Aristotle Amadopolis','Atkins, State Comptroller','Mary Bailey','Birchibald \'Birch\' T. Barlow','Jasper Beardly','Benjamin, Doug, and Gary','Bill and Marty','Blinky','Blue Haired Lawyer','Boobarella','Wendell Borton','Jacqueline Bouvier','Ling Bouvier','Patty Bouvier','Selma Bouvier','Kent Brockman','Bumblebee Man','Charles Montgomery Burns','Capital City Goofball','Carl Carlson','Crazy Cat Lady','Superintendent Gary Chalmers','Charlie','Chase','Scott Christian','Comic Book Guy','Mr. Costington','Database','Declan Desmond','Disco Stu','Dolph','Lunchlady Doris','Duffman','Eddie and Lou','Ernst and Gunter','Fat Tony','Maude Flanders','Ned Flanders','Rod Flanders','Todd Flanders','Francesca','Frankie the Squealer','Professor John Frink','Baby Gerald','Gino','Mrs. Glick','Gloria','Barney Gumble','Gil Gunderson','The Happy Little Elves','Judge Constance Harm','Herman Hermann','Bernice Hibbert','Dr. Julius Hibbert','Elizabeth Hoover','Lionel Hutz','Itchy &amp; Scratchy','Albert Brooks','Jimbo Jones','Rachel Jordan','Kang and Kodos','Princess Kashmir','Kearney Zzyzwicz','Edna Krabappel','Rabbi Hyman Krustofski','Krusty the Clown','Cookie Kwan','Dewey Largo','Legs and Louie','Leopold','Lenny Leonard','Lewis','Helen Lovejoy','Reverend Timothy Lovejoy','Coach Lugash','Luigi','Lurleen Lumpkin','Otto Mann','Captain Horatio McCallister','Roger Meyers, Jr.','Troy McClure','Hans Moleman','Dr. Marvin Monroe','Nelson Muntz','Captain Lance Murdock','Bleeding Gums Murphy','Lindsey Naegle','Apu Nahasapeemapetilon','Manjula Nahasapeemapetilon','Sanjay Nahasapeemapetilon','Old Barber','Old Jewish Man','Patches and Poor Violet','Arnie Pye','Poochie','Herbert Powell','Janey Powell','Lois Pennycandy','Ruth Powers','Martin Prince','Dr. J. Loren Pryor','Mayor \'Diamond Joe\' Quimby','Radioactive Man','The Rich Texan','Richard','Dr. Nick Riviera','Santa\'s Little Helper','Sherri and Terri','Dave Shutton','Sideshow Bob','Sideshow Mel','Grampa Abraham Simpson','Amber Simpson','Mona Simpson','Agnes Skinner','Principal Seymour Skinner','Waylon Smithers','Snake Jailbird','Snowball','Judge Roy Snyder','Jebediah Springfield','Cletus Spuckler','Brandine Spuckler','Squeaky-Voiced Teen','Moe Szyslak','Drederick Tatum','Allison Taylor','Mr. Teeny','Cecil Terwilliger','Johnny Tightlips','Üter','Kirk Van Houten','Luann Van Houten','Milhouse Van Houten','Hank Azaria','Chief Clancy Wiggum','Ralph Wiggum','Sarah Wiggum','Groundskeeper Willie','Wiseguy','Rainier Wolfcastle','Yes Guy','Artie Ziff'];
var input = document.getElementById('bonanza');
var scope = bonanza(input, request);

function request(query, callback) {
  console.info('Loading more items: ', query);
  setTimeout(function () {
    var items = list
      .sort()
      .filter(function (item) {
        return new RegExp(query.search, 'i').test(item);
      })
      .slice(query.offset, query.limit + query.offset);

    callback(null, items);
  }, 300);
}
