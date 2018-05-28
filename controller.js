var snake = {
  dom:{
    gameContainer:document.getElementById("game-box"),
    configButton:document.getElementById("menu-button"),
    configBox:document.getElementById("config-box"),
    gridsRange:document.getElementById("form-grids"),
    sizeRange:document.getElementById("form-size"),
    speedRange:document.getElementById("form-speed"),
    resetButton:document.getElementById("reset-button"),
    htmlStyles:document.getElementById("cell-size"),
    startButton:document.getElementById("game-state"),
    score:document.getElementById("score-output")
  },
  defaults:{
    direction:"right",
    grids:20,
    size:25,
    speed:10
  },
  data:{
    configBoxOpened:false,
    cells:[],
    emptyMap:{}
  },
  init:function(){
    this.addEvents();
    this.addControllers();
    this.adjustGrids();
    this.initRanges();
    this.endGame();
  },
  addEvents:function(){
    document.body.addEventListener("click",(function(event){
      var clickConfigBox = this.dom.configBox.contains(event.target);
      var clickConfigButton = this.dom.configButton.contains(event.target);
      var clickGameBox = this.dom.gameContainer.contains(event.target);
      var configBoxOpened = this.data.configBoxOpened === true;
      if((!clickConfigBox && !clickConfigButton) || (clickConfigButton && configBoxOpened)){
        this.dom.configBox.classList.add("box-hidden");
        this.data.configBoxOpened = false;
      }
      if(clickConfigButton && !configBoxOpened){
        this.dom.configBox.classList.remove("box-hidden");
        this.data.configBoxOpened = true;
      }

      if(clickGameBox && this.data.gamePending){
        var element = this.findCell(this.data.cells[0]);
        var coords = {
          x:event.clientX - (element.offsetLeft + (element.offsetWidth / 2)),
          y:event.clientY - (element.offsetTop + (element.offsetHeight / 2))
        };
        var sides = {
          x:["left","right"],
          y:["up","down"]
        };
        var orientation = Math.abs(coords.x) > Math.abs(coords.y) ? "x":"y";
        if(coords[orientation]>0) sides[orientation].reverse();
        this.setDirection.apply(this,sides[orientation]);
      }

    }).bind(this));

    this.dom.startButton.addEventListener("click",(function(event){
      if(!this.data.gamePending){
        this.newGame();
      } else {
        if(this.data.gamePaused){
          this.startGame();
        } else {
          this.pauseGame();
        }
      }
    }).bind(this))

    this.dom.gridsRange.addEventListener("input",(function(event){
      this.setGridsRange(event.target,event.target.value);
    }).bind(this));
    
    this.dom.sizeRange.addEventListener("input",(function(){
      this.setSizeRange(event.target,event.target.value);
    }).bind(this));

    this.dom.speedRange.addEventListener("input",(function(event){
      this.setSpeedRange(event.target,event.target.value);
    }).bind(this));

    this.dom.resetButton.addEventListener("click",this.initRanges.bind(this));
    this.dom.gridsRange.addEventListener("mousedown",toggleGrid.bind(this,'add'));
    this.dom.sizeRange.addEventListener("mousedown",toggleGrid.bind(this,'add'));
    this.dom.gridsRange.addEventListener("mouseup",toggleGrid.bind(this,'remove'));
    this.dom.sizeRange.addEventListener("mouseup",toggleGrid.bind(this,'remove'));

    function toggleGrid(action){
      this.dom.gameContainer.classList[action]("mark-cells");
    }
  },
  endGame: function(){
    this.data.direction = this.defaults.direction;
    this.data.turn = this.data.direction;
    this.data.gamePaused = false;
    this.data.gamePending = false;
    this.dom.startButton.innerHTML = "New Game";
    clearInterval(this.data.interval);
    this.settingsEditable(true);
  },
  newGame: function(){
    this.data.gamePending = true;
    this.data.gamePaused = true;
    this.dom.startButton.innerHTML = "Start";
    this.generateTable();
    this.generateEmptyMap();
    this.refreshScore('reset');
    this.refreshFuel();
    this.generateSnake();
    this.mountNewInterval();
  },
  pauseGame: function(){
    this.data.gamePaused = true;
    this.dom.startButton.innerHTML = "Start";
    this.settingsEditable(true);
  },
  startGame: function(){
    this.data.gamePaused = false;
    this.dom.startButton.innerHTML = "Pause";
    this.settingsEditable(false);
  },
  initRanges: function(){
    this.setGridsRange(this.dom.gridsRange,this.defaults.grids);
    this.setSizeRange(this.dom.sizeRange,this.defaults.size);
    this.setSpeedRange(this.dom.speedRange,this.defaults.speed);
  },
  setGridsRange: function(element,value){
    this.data.grids = Number(value);
    element.value = value;
    this.generateTable();
    this.generateEmptyMap();
    this.data.fuelCell = null;
    this.refreshScore('reset');
    this.endGame();
  },
  setSizeRange: function(element,value){
    this.data.size = value + "px";
    element.value = value;
    this.dom.htmlStyles.innerHTML = "[class^='cell']{width:" + this.data.size + "; height:" + this.data.size + ";}";
  },
  setSpeedRange: function(element,value){
    this.data.speed = Math.round(1000 / Number(value));
    this.data.score = Number(value);
    element.value = value;
    if(this.data.gamePending) this.mountNewInterval();
  },
  generateSnake: function(){
    var initCell = Math.floor(this.data.grids / 2);
    var params = [initCell,initCell];
    this.data.cells = [params];
    this.colorCell(params);
  },
  generateTable: function(){
    this.dom.gameContainer.innerHTML = "";
    for(var x=0;x<this.data.grids;x++){
      var row = document.createElement('DIV');
      row.classList.add('row-'+(x+1));
      for(var y=0;y<this.data.grids;y++){
        var cell = document.createElement('DIV');
        cell.classList.add('cell-'+(y+1))
        row.appendChild(cell);
      }
      this.dom.gameContainer.appendChild(row);
    }
  },
  generateEmptyMap: function(){
    this.data.emptyMap = {};
    for(var x = 1;x <= this.data.grids;x++){
      this.data.emptyMap[x] = {};
      for(var y = 1;y <= this.data.grids;y++){
        this.data.emptyMap[x][y] = y;
      }
    }
  },
  addControllers: function(){
    document.addEventListener('keydown',(function(event){
      event.preventDefault();
      switch(event.keyCode){
        case 32:
        case 13:
          if(this.data.gamePending){
            if(this.data.gamePaused){
              this.startGame();
            } else{
              this.pauseGame();
            }
          }
          break;
        case 37:
          this.setDirection("left","right");
          break;
        case 38:
          this.setDirection("up","down");
          break;
        case 39:
          this.setDirection("right","left");
          break;
        case 40:
          this.setDirection("down","up");
          break;
      }
    }).bind(this))
  },
  adjustGrids: function(){
    if(window.innerWidth < this.defaults.grids* this.defaults.size){
      this.defaults.grids = Math.floor(window.innerWidth/this.defaults.size);
    }
  },
  setDirection: function(direction,opposite){
    this.data.turn = this.data.direction === opposite && this.data.cells.length > 1 ? opposite:direction;
  },
  mountNewInterval: function(){
    clearInterval(this.data.interval);
    this.data.interval = setInterval((function(){
      if(this.data.gamePaused) return;
      var newCells = this.nextCell();
      this.refreshSnakeCells(newCells);
    }).bind(this),this.data.speed);
  },
  nextCell: function(){
    var x = this.data.cells[0][0];
    var y = this.data.cells[0][1];
    switch(this.data.turn){
      case "down":
        this.data.direction = "down";
        x = x + 1 > this.data.grids ? 1:x + 1;
        break;
      case "up":
        this.data.direction = "up";
        x = x - 1 < 1 ? this.data.grids:x - 1;
        break;
      case "right":
        this.data.direction = "right";
        y = y + 1 > this.data.grids ? 1:y + 1;
        break;
      case "left":
      this.data.direction = "left";
        y = y - 1 < 1 ? this.data.grids: y - 1;
        break;
    };
    return [x,y];
  },
  refreshSnakeCells: function(first){
    var last = this.data.cells[this.data.cells.length - 1];
    var moveOnEmpty = typeof this.data.emptyMap[first[0]] === "object" && typeof this.data.emptyMap[first[0]][first[1]] === "number";
    var moveOnLast = first[0] === last[0] && first[1] === last[1];
    
    if(!moveOnEmpty && !moveOnLast){
      this.endGame();
      for(var i in this.data.cells){
        var cell = this.findCell(this.data.cells[i]);
        cell.classList.remove('fill');
        cell.classList.add('gameover');
      }
      return;
    }
    
    delete this.data.emptyMap[first[0]][first[1]];
    if(!Object.getOwnPropertyNames(this.data.emptyMap[first[0]])) delete this.data.emptyMap[first[0]];

    var hasEatenFuelCell = first[0]===this.data.fuelCell[0] && first[1]===this.data.fuelCell[1];
    if(!hasEatenFuelCell){
      var last = this.data.cells.pop();
      this.clearCell(last);
      if(!this.data.emptyMap[last[0]]) this.data.emptyMap[last[0]] = {};
      this.data.emptyMap[last[0]][last[1]] = last[1];
    } else {
      this.refreshFuel();
      this.refreshScore('add',this.data.score);
    }

    this.data.cells.unshift(first);
    this.colorCell(first);
  },
  refreshFuel: function(){
    var randomRow = this.randomProperty(this.data.emptyMap);
    var randomCell = this.randomProperty(this.data.emptyMap[randomRow]);
    if(this.data.fuelCell) this.findCell(this.data.fuelCell).classList.remove("fuel");
    this.data.fuelCell = [Number(randomRow),Number(randomCell)];
    var newFuelElement = this.findCell(this.data.fuelCell);
    newFuelElement.classList.add("fuel");
  },
  refreshScore: function(action,val){
    switch(action){
      case "reset":
        this.dom.score.innerHTML = 0;
        break;
      case "add":
      this.dom.score.innerHTML = Number(this.dom.score.textContent) + val;
        break;
    }
  },
  randomProperty: function(obj){
    var properties = Object.getOwnPropertyNames(obj);
    var random = Math.floor((Math.random() * properties.length));
    return properties[random];
  },
  settingsEditable: function(editable){
    var elements = [this.dom.gridsRange,this.dom.sizeRange,this.dom.speedRange,this.dom.resetButton];
    for(var i in elements){
      if(!editable) elements[i].setAttribute("disabled","disabled");
      if(editable) elements[i].removeAttribute("disabled","disabled");
    }
  },
  colorCell: function(params){
    this.findCell(params);
    var cell = this.findCell(params);
    cell.classList.add('fill');
  },
  clearCell: function(params){
    var cell = this.findCell(params);
    cell.classList.remove('fill');
  },
  findCell: function(params){
    return document.querySelector('.row-' + params[0] + '>.cell-' + params[1]);
  }
}

snake.init();