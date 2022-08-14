const random = (length = 8) => {
    // Declare all characters
    //let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let chars = 'abcdefghijklmnopqrstuvwxyz';

    // Pick characers randomly
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
};


function shuffleArray(array) {
  let curId = array.length;
  // There remain elements to shuffle
  while (0 !== curId) {
    // Pick a remaining element
    let randId = Math.floor(Math.random() * curId);
    curId -= 1;
    // Swap it with the current element.
    let tmp = array[curId];
    array[curId] = array[randId];
    array[randId] = tmp;
  }
  return array;
}


function newGame() {
    console.log("Starting new game");

    // Read board size
    var M = document.getElementById("M").value;
    var N = document.getElementById("N").value;

    /*if (M * N % 2 == 1) {
        alert("M or N must be even");
        return true;
    }*/

    // Print player names
    var playerRow = scoreTable.childNodes[3];
    playerRow.childNodes[1].innerText = player0.value + ":";
    var playerRow = scoreTable.childNodes[5];
    playerRow.childNodes[1].innerText = player1.value + ":";

    // Instantiate game and draw board
    let game = new Mememory(M, N);
    game.drawBoard(memoryBoard, scoreBoard);

    // Make setup invisible and game board visible
    setupContainer.style.display = "none";
    memoryContainer.style.display = "flex";

    return false;
}


class Mememory {
    constructor(M, N) {
        this._initialized = this._initialize(M, N);
    }

    async _initialize(M, N) {
        console.log("Initialize game");

        this.M = M;
        this.N = N;
        /*if (this.M * this.N % 2 == 1) {
            throw "Number of cards in Mememory must be even";
        }*/

        // Fetch memes
        let numMemes = Math.ceil(this.M * this.N / 2);

        await fetch(`https://meme-api.herokuapp.com/gimme/${numMemes.toString()}`)
        .then(response => response.json())
        .then(responseData => {
            this.images = [...Array(numMemes)].map(
                (_, i) => responseData["memes"][i]["url"]
            );
        });

        // Shuffle board
        this.board = new Array(this.M * this.N);
        this.board = [...Array(this.M * this.N)].map(
            (_, i) => Math.floor(i / 2)
        );
        //for (let i = 0; i < numMemes; i++) {
        //    this.board[2 * i]     = i;
        //    this.board[2 * i + 1] = i;
        //}
        this.board = shuffleArray(this.board);

        this.player = 0;
        this.score = [0, 0];
        this.openCards = [];
        this.removedCards = [];

        this.playerRow = [scoreTable.childNodes[3], scoreTable.childNodes[5]];

        console.log("Initialize game done");
    }

    async drawBoard(boardTable, scoreTable) {
        console.log("Draw board");

        await this._initialized;

        for (let i = 0; i < this.M; i++) {
            var tableRow = document.createElement("TR");
            for (let j = 0; j < this.N; j++) {
                var tableData = document.createElement("TD");
                var textnode = document.createTextNode(i.toString() + ":" + j.toString());
                var image = document.createElement("IMG");
                var card = document.createElement("div");

                // Image properties
                image.src = this.images[this.board[this.N * i + j]];
                console.log(this.board[this.N * i + j]);
                console.log(this.images[this.board[this.N * i + j]]);
                console.log(this.images);
                image.style.opacity = 0;

                image.style.height = "100%";
                image.style.width = "100%";

                // Card properties
                card.classList.add("card");

                let that = this;
                card.number = this.N * i + j;
                card.onclick = function() {
                    that.play(this, scoreTable);

                };

                card.appendChild(image);
                tableData.appendChild(card);
                tableRow.appendChild(tableData);
            }
            boardTable.appendChild(tableRow);
        }

        this.playerRow[0].style.backgroundColor = "lightgreen";
    }

    play(card, scoreTable) {
        console.log("Card number " + card.number.toString() + " is played");

        // Check if less than two cards open
        if (this.openCards.length >= 2) {
            console.log("Already two cards open");

            this.openCards[0].childNodes[0].style.opacity = 0;
            this.openCards[1].childNodes[0].style.opacity = 0;
            this.openCards = [];

            return null;
        }

        // Check if card has been removed
        if (this.removedCards.includes(card)) {
            console.log("Card is already removed");
            return null;
        }

        // Check if card is already open
        if (this.openCards.includes(card)) {
            console.log("Card is already open");
            return null;
        }

        // Open card
        this.openCards.push(card);
        card.childNodes[0].style.opacity = 1;

        // Check if openCards are a match
        if (this.openCards.length == 2) {
            // If YES
            if (this.board[this.openCards[0].number] == this.board[this.openCards[1].number]) {
                console.log("It's a match");

                this.removedCards.push(this.openCards[0]);
                this.removedCards.push(this.openCards[1]);

                //this.openCards[0].childNodes[0].style.opacity = 0.3;
                //this.openCards[1].childNodes[0].style.opacity = 0.3;

                this.openCards[0].classList.add("removed");
                this.openCards[1].classList.add("removed");
                this.openCards = [];

                // Print score
                this.score[this.player] = this.score[this.player] + 1;
                this.playerRow[this.player].childNodes[3].innerText = this.score[this.player].toString();

                // Check if game ended
                if (this.score[0] + this.score[1] == Math.floor(this.M * this.N / 2)) {
                    this.endGame();
                }

            } else {
                // If NO
                console.log("Not a match");

                this.playerRow[this.player].style.backgroundColor = "white";
                this.player = (this.player + 1) % 2;
                this.playerRow[this.player].style.backgroundColor = "lightgreen";

                //let that = this;
                //setTimeout(function() {
                //    that.openCards[0].childNodes[0].style.opacity = 0;
                //    that.openCards[1].childNodes[0].style.opacity = 0;
                //    that.openCards = [];
                //}, 1000)
            }
        }
    }

    endGame() {
        console.log("Game ended");

        if (this.score[0] > this.score[1]) {
            alert(`${player0.value} is the winner!`);
        } else if (this.score[0] < this.score[1]) {
            alert(`${player1.value} is the winner!`);
        } else {
            alert("Everybody is a winner in their own special way!");
        }
    }
}


const memoryContainer = document.getElementById("memoryContainer");
const setupContainer = document.getElementById("setupContainer");
const memoryBoard = document.getElementById("memoryBoard");
const scoreBoard = document.getElementById("scoreTable");
const player0 = document.getElementById("player0");
const player1 = document.getElementById("player1");

setupContainer.style.display = "flex";
