"use strict";
// Изменить HOST на свой !!

$(document).ready(function () {
    let player = '';
    let roomid = '';
    let whogoes = '';
    let whowin = 0;
    let username = '';
    let playerflag = ''; // локальный флаг для проверки хода
    let interval; // для остановки setIntraval
    let flag = 0; // срабатывает когда присоединяется второйо игрок

    const HOST = 'http://pmchair.esy.es/tictac';  //хост для ajax

    // Ход
    $('.table').on('click', function (e) {

        if((player == whogoes) && (player == playerflag)) {
            clientTurnFlag(whogoes);

            let col = $(e.target).data('col');
            let row = $(e.target).data('row');

            $.ajax( HOST + '/main/turn/', {
                type: 'POST',
                dataType: 'json',
                success: function (response) {
                    checkField(response.field);
                    whogoes = response.whogoes
                    whowin = response.whowin;
                    endGame(whowin);
                },
                data: { 'player': player,
                        'roomid': roomid,
                        'whogoes': whogoes,
                        'col': col,
                        'row': row,
                        'username': username
                      }
            });
        }
    });

    //Старт игры
    $('#btn').on('click', function () {

        $.ajax( HOST + '/main/start/', {
            type: 'POST',
            dataType: 'json',
            success: function (response) {
                    player = response.player;
                    roomid = response.roomid;
                    whogoes = response.whogoes;
                    playerflag = response.whogoes;
                    hideElements();
                    showHead(response.id);
                    interval = setInterval(statusCheck, 4000);
            },
            data: { 'username': username}
        });

        setInterval(statusCheck, 200);
    });

    // присоединиться к игре
    $('#games').on('click', function (e) {

        let id = $(e.target).data('id');
        $.ajax( HOST + '/main/join/', {
            type: 'POST',
            dataType: 'json',
            success: function (response) {
                    if(response.length !== 0) {
                        checkField(response.field);
                        whogoes = response.whogoes;
                        playerflag = response.whogoes;
                        roomid = response.roomid;
                        player = response.player2;
                        hideElements();
                        setInterval(statusCheck, 4000);
                    } else {
                        $('#myError').modal('show');
                        interval = listGames();
                    }

            },
            data: { 'id': id,
                    'username': username
                  }
        });
    });

    // если игрок нажимет покинуть комнату отправляется запрос на закрытие комнаты
    $('.main').on('click', function () {

        $.ajax( HOST + '/main/leave/', {
            type: 'POST',
            dataType: 'json',
            success: function (response) {

            },
            data: { 'room': roomid }
        });
    });

    //обновление доступных игр
    $('#refresh').on('click', function () {
        listGames();
    });

    //проверка поля и отображение Х и О
    function checkField(field) {
        for(let i = 0; i < 3; i++) {
            for(let j = 0; j < 3; j++) {
                if(field[i][j] == 0 ) continue;
                field[i][j] == 1 ? $('[data-row = ' + i + ']'+ '[data-col = ' + j + ']').find('.svgX').show() :
                                   $('[data-row = ' + i + ']'+ '[data-col = ' + j + ']').find('.svgO').show();
            }
        }
    }
    // проверка подключения и хода второго игрока
    function statusCheck() {
        $.ajax( HOST + '/main/check/',{
            type: 'POST',
            dataType: 'json',
            success: function (response) {

                if(response.draw == 1) draw();
                // проверяем наличие второго игрока
                if(response.player1name && (response.player1name != username) && !flag)
                        getOpponent(response.player1name);
                if(response.player2name && (response.player2name != username) && !flag)
                    getOpponent(response.player2name);
                //проверяем кто ходит
                if(response.whogoes) {
                    response.whogoes == player ? playerTurnHead(1) : playerTurnHead(2);
                    endGame(whowin);
                    whowin = response.whowin;
                    if(response.whogoes != whogoes) {
                        playerflag = response.whogoes;
                        whogoes = response.whogoes;
                        checkField(response.field);
                    }
                }
            },
            data: { 'roomid': roomid }
        });
    }
    // статистика опонента
    function getOpponent(opponent) {
        flag = 1;
        $.ajax( HOST + '/main/opponent/', {
            type: 'POST',
            dataType: 'json',
            success: function (result) {
                showUserStats('.oppstats',result.login, result.win, result.lose);
            },
            data: { 'opponent': opponent}
        });
    }
    
    //получение статистики игрока
    function getUserStats() {
        $.getJSON( HOST + '/login/getUserStats', function (result) {
            username = result.login;
            listGames();
            showUserStats('.playerstats',result.login, result.win, result.lose);
        });
    }
    // отображение статистики игрока или оппонента в зависимости от класса
    function showUserStats(cssClas,user, userwin, userlose) {
        let div = $('<div>Игрок: ' + user + '</div>');
        let div2 = $('<div>Победы: ' + userwin + '</div>');
        let div3 = $('<div>Поражения: ' + userlose + '</div>');
        div.appendTo($(cssClas));
        div2.appendTo($(cssClas));
        div3.appendTo($(cssClas));
    }
    // получение списка доступны игр
    function listGames() {
        $.ajax( HOST + '/main/list/',{
            type: 'POST',
            dataType: 'json',
            success: function (response) {
                sortGames(response);
            }
        });
    }
    // отображение списка комнат
    function sortGames(games) {
        $('.rooms').remove();
        for(let key in games) {
           let colmd = $('<div class="col-sm-4 rooms"></div>');
           let btn = $('<button class="join btn btn-info"" data-id="' + games[key]['id'] + '">Присоединиться к игре</button>');
           let roomname = $('<h4>Номер комнаты :   ' + games[key]['id'] + '</h4>');
           let pname = $('<div>Игроки в комнате : ' + games[key]['player1name'] + '</div>');

           roomname.appendTo(colmd);
           pname.appendTo(colmd);
           btn.appendTo(colmd);
           colmd.appendTo($('#games'));
        }
    }
    // запуск победы или поражения
    function endGame(whoWin) {
        if(whoWin == player) winner();
        if((whoWin != 0) && (whoWin != player)) lose();
    }

    function winner() {
        $('.modal_text').text('ПОЗДРАВЛЯЕМ ВЫ ВЫИГРАЛИ!!');
        $('#myModal').modal('show');
    }

    function lose() {
        clearInterval(interval);
        $('.modal_text').text('ВЫ ПРОИГРАЛИ');
        $('#myModal').modal('show');
    }
    // отображение ничьи
    function draw() {
        clearInterval(interval);
        $('.modal_text').text('Ничья!!');
        $('#myModal').modal('show');
    }
    // при старте игры прячем комнаты и кнопки
    function hideElements() {
        $('.field_hide').show();
        $('.head .btn').show();
        $('.buttons').hide();
        $('#games').hide();
    }
    // отображение комнаты в head
    function showHead(id) {
        let h4 = $('<h4 class="center-block">Номер комнаты: ' + id + '</h4>');
        $('.main').show();
        $('.head h1').after(h4);
    }
    // отображение
    function playerTurnHead(turn) {
        switch (turn) {
            case 1:
                if(!($('.player_turn').text() == 'Ваш Ход'))
                    $('.player_turn').text('Ваш Ход');
                break;
            case 2:
                if(!($('.player_turn').text() == 'Ход Соперника'))
                    $('.player_turn').text('Ход Соперника');
                break;
        }
    }
    // закрываем возможность много раз отпарвлять ход за раз
    // при долгой отдачи от сервер, пока не пришел запрос меняем сразу того кто ходит
    function clientTurnFlag(player) {
        switch (player) {
            case 1:
                playerflag = 2;
                break;
            case 2:
                playerflag = 1;
                break;
        }
    }
    // при старте игры получаем статистику игрока
    getUserStats();
});

