/*** @jsx React.DOM */

var sumOfValues = {sum: 0}; //obiekt zawiera jedo pole sum - suma wydatkow. 
var myJSON = []; //tablica obiektow zawierajacych pola z opisem wydatku, kowocie i dacie dodania wydatku
var firebaseRef = new Firebase("https://sweltering-torch-414.firebaseio.com"); //referencja do firebase
firebaseRef.on("value", function(items){	//wczytuje dane z firebase 
	myJSON.push({key: items.key(), description: items.val().description, value: items.val().value, date: items.val().date}); //wypelnia tablice myJSON wartosciami z firebase
	sumOfValues.sum += parseInt(items.val().value); //oblicza poczatkowa sume wpisanych wydatkow i zaspiuje ja w sumOfValues.sum
	});

function getItems() { //wywolywana w celu odswiezenie tablicy myJSON bo to wlasnie z niej wyswietlane sa wartosci
	myJSON = []; //czyszci tablice myJSON zby moc "zrobic push"
	firebaseRef.on("child_added", function(items){
		myJSON.push({key: items.key(), description: items.val().description, value: items.val().value, date: items.val().date});//ponowne wypelnienie myJSON
	})
	return myJSON;
};

function enterPressed() { //po wcisnieciu enter gdy kursor znajduje sie w polu tekstowym wywoluje funkcje AddNewItem(). wywolana po wczytaniu komponentu React poniewaz odwoluje sie do ID komponentow.
	$("#valueInput").keypress(function (e) {
		if (e.keyCode == 13) {
			addNewItem();
		}
	});
	$("#descriptionInput").keypress(function (e) {
		if (e.keyCode == 13) {
			addNewItem();
		}
	});	
};

function addNewItem() {//dodaje nowe obiekty do firebase na podstawie wartosci wpisanych w pola tekstowe. dolaczona jest rowniez data w kotrej dodawany jest wydatek. zadziala tylko jesli wypelnione sa oba pola tekstowe. w przeciwnym wypadku wyswietli sie monit o wypelnienie obu pol.
	if (($("#descriptionInput").val() == "")  || ($("#valueInput").val() == "")) {
		alert("Wypelnij oba pola!");
	}
	else {
		firebaseRef.push({value: $("#valueInput").val(), description: $("#descriptionInput").val(), date: formatDate()});
		$("#descriptionInput").val(""); //po dodaniu itemu do firebase czysci pola input
		$("#valueInput").val("");
	}	
};

function sumValues() { // oblicza (odswieza) sume wydatkow
	sumOfValues = {sum: 0};
	for (var i = 0; i < myJSON.length; i++) {
		sumOfValues.sum += parseInt(myJSON[i].value);
	}
	return sumOfValues; 
};

function formatDate() { // przygotowuje aktualna date od formatu przystepnego do wyswietlenia
	var months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]; 
	var now = new Date();
	d = now.getDate() + "-" + months[now.getMonth()] + "-" + now.getFullYear() + " " + now.getHours() + ":" + (function() {
		if (now.getMinutes()<10) {
			return "0"+now.getMinutes();
		}
		else {
			return now.getMinutes()
		}
	}) ();
	return d;
};

var ItemsList = React.createClass({	//towrzy nowa klase ItemsList
	getInitialState:function() {		//Inicjuje stan poczatkowy state'ow items i sum
		return {
			items: [],
			sum: sumOfValues
		}
	},

	componentDidMount: function() { // gdy komponent zostanie wczytany uruchamia obsluge klawisza enter i w interwalach 200ms wywoluje metode updateList
		setInterval(this.updateList, 200);
		enterPressed();
	},

	validateInput: function() { //walidacja wpisanych wartosci wydatkow za pomoca RegExp. jesli zostanie wpisany inny znak niz liczba wyswietli monit i wyczysci pole tekstowe.
		var intOnly = /[^\d]+$/;
		if (intOnly.test($("#valueInput").val())) {
			$("#valueInput").val("");
			alert("Hej, Hej! Tylko liczby poproszę!")
		}
	},

	updateList: function() { //odswieza tablice myJSON i sume wydatkow (sumOfValues.sum) oraz ustawia nowe wartosci dla stanow items i sum.
		this.setState({items: getItems()})
		this.setState({sum: sumValues()});
	},

	render: function(){ // przygotowuje elementy do wyswietlenia w DOM
	return (
			<div>
				<div id="inputFields">
					<h2>Wydatki</h2>
					<input type="text" id="descriptionInput" placeholder="Opis..." /> 
					<input type="text" id="valueInput" placeholder="Wartosc w PLN" onKeyUp={this.validateInput}/>
				</div>
				<div className="autocenter">
					<ul>
						<List items={this.state.items} sum={this.state.sum} id=""/>
					</ul>
					<p id="pSuma">{"Suma: " + this.state.sum.sum + " zł"}</p>
				</div>
			</div>
			)		
	}
});

var List = React.createClass({	// tutaj przygotowuja sie elementy listy dla komponentu powyzej. przekazywane sa stany items i sum a potem mapowane do elementu li.
	handleClick: function(elementKey) {// metoda wykonuje sie po kliknieciu obrazka zamknij.png i usuwa element z listy na podstawie id elementu rownego id elementu w firebase. 
		var itemRef = new Firebase("https://sweltering-torch-414.firebaseio.com/" + elementKey);
		itemRef.remove();
	},

	render: function() {
		return(
		<div>
		{
			this.props.items.map(function(item) {
				return (<div id="liElement" key={item.key}><li className="leftElement">{item.date}</li><li className="middleElement">{item.description}</li><li className="rightElement">{item.value + " zł"}<img id="img" src="images/zamknij.png"  onClick={this.handleClick.bind(this, item.key)}/></li></div>)
			}.bind(this))
		}
		</div>
			)
	}
});

React.render(<ItemsList />, document.body) //wczytanie komponentu do DOM
