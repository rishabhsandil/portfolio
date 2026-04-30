
var scores,round_score,active_player,dice,winning_score;

newGame();

document.querySelector(".btn-roll").addEventListener('click',function(){
    dice = Math.floor(Math.random()*6)+1;
    document.querySelector('.dice').style.display='block';
    document.querySelector('.dice').src = './images/dice-' + dice + '.png';
        round_score=dice;
scores[active_player]+=round_score;
        document.querySelector('#score-'+ active_player).textContent=(scores[active_player]);
    
    if(scores[active_player]>=winning_score){
            document.querySelector('#name-'+active_player).textContent='Winner';
            document.querySelector('.btn-roll').style.display='none';
        }
NextPlayer();
});


document.querySelector('.btn-new').addEventListener('click',newGame);

function NextPlayer(){

    document.querySelector('.player-'+active_player+'-panel').classList.toggle('active');
    if(active_player==0){
        active_player=1;
    }
    else{
        active_player=0;
    }
    document.querySelector('.player-'+active_player+'-panel').classList.add('active');
    
}

function newGame(){
    scores = [0,0];
    round_score = 0;
    active_player = 0;
    document.querySelector('.dice').style.display='none';

    document.getElementById('score-0').textContent='0';
    document.getElementById('score-1').textContent='0';
    document.querySelector('.btn-roll').style.display='block';
    document.querySelector('#name-1').textContent='PLAYER 2';
    document.querySelector('#name-0').textContent='PLAYER 1';

}

document.querySelector('.modal').addEventListener('keypress', function (e) {
    var key = e.which || e.keyCode;
    if (key === 13) {
        if(Number(document.querySelector('#input_number').value)>=1){
        winning_score=Number(document.querySelector('#input_number').value);
        document.querySelector('.modal').classList.add('bye');
     }
    }
});