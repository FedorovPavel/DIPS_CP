var menuTab = {
    catalog: 0,
    orders: 1,
}
var menuManager = new class menu {
    constructor(){
        this.errorTemplate  = null;
        this.lastCount      = 20;
        this.page           = 0;
        this.pages;
        this.count          = 20;
        this.draftExecution = false;
        this.openTabs       = menuTab.catalog;
        this.token = null;
        this.refreshToken = null;
        this.tokenTimer = null;
        this.iframeTemplate = null;
    };
    //  Error template

    //  Получение шаблона для вывода ошибок
    getErrorTemplate(){
        let self = this;
        self.errorTemplate = $('div#error-template').clone();
        $(self.errorTemplate).removeClass('hidden');
        $('div#error-template').remove();
        $(self.errorTemplate).removeAttr('id');
        return;
    }

    getReportsTemplate(){
        let self = this;
        self.reportTemplate = $('div#report_template').clone();
        $('div#report_template').remove();
        $(self.reportTemplate).removeClass('hidden');
        $(self.reportTemplate).removeAttr('id');
        return;
    }

    //  Отображение template
    rendErrorTemplate(err_msg, err_status){
        var self = this;
        let template = $(self.errorTemplate).clone();
        $(template).find('span.status_code').text(err_status);
        $(template).find('span.error_msg').text(err_msg);
        $('body').append(template);
        setTimeout(function(){
            $(template).remove();
        },5000);
        return;
    }

    //  Отображение template в листе
    rendErrorTemplateToList(err_msg, err_status){
        var self = this;
        self.clearList();
        self.page = 0;
        let template = $(self.errorTemplate).clone();
        $(template).find('span.status_code').text(err_status);
        $(template).find('span.error_msg').text(err_msg);
        $(template).removeClass('absolute-position');
        $(template).find('.error_content').addClass('list');
        $(self.getList()).append(template);
        return;
    }

    getIFrameTemplate() {
        let self = this;
        self.iframeTemplate = $('div#iframe_template').clone();
        $('div#iframe_template').remove();
        $(self.iframeTemplate).removeClass('hidden-template');
        return;
    }

    checkAuth() {
        if (this.refreshToken)
            return true;
        return false;
    }
    
    //  Validate methods 
    checkPosIntNumber(text){
        if (text){
            let res = Number(parseInt(text));
            if (isNaN(res) || res < 0)
                return null;
            return res;
        }
        return null;
    }

    checkID(id){
        if (id){
            return id;
        } else {
            return null;
        }
    }

    checkPaySystem(text){
        const admissibleSystems = ['Сбербанк','Открытие','Возрождение','Тинькофф','RocketBank', 'Raiffeisen',
                                    'Альфа-банк'];
        if (text){
            let res = String(text);
            if (admissibleSystems.indexOf(res) != -1)
                return res;
            else 
                return null;
        } else {
            return null;
        }
    }

    checkAccount(text){
        if (text){
            const input = String(text);
            const accountParts = input.split(' ');
            if (accountParts.length < 4 || accountParts.length >= 6)
                return null;
            else {
                for (let I = 0; I < accountParts.length; I++){
                    const temp = Number(accountParts[I]);
                    if (isNaN(temp) || accountParts[I].length < 4){
                        return null;
                    }
                }
                return input;
            }
        } else {
            return null;
        }
    }

    checkCost(text){
        if (text){
            let number = parseFloat(text);
            if (isNaN(number) || number < 10.0)
                return null;
            else 
                return Number(number);
        } else {
            return null;
        }
    }

    getList(){
        return 'div#list';
    }

    //  Инициализация меню
    bindHandleToHeader(){
        var self = this;
        const menuPills = $('ul#nav-pills');    
        const cars      = menuPills.find('li#automobile-pill');
        const orders    = menuPills.find('li#orders-pill');
        const report    = menuPills.find('li#report-pill');
        $('button#auth_submit').click(function() {
            self.authUser();
        });
        $('button#auth_Mail').click(function() { 
            self.authByMail();
        });
        $('button#reg_submit').click(function() {
            self.regUser();
        });

        $(cars).click(function(){
            if (self.openTabs != menuTab.catalog) {
                self.openTabs = menuTab.catalog;
                $(menuPills).find('li').removeClass('active');
                $(this).addClass('active');
                self.page = 0;
                self.changePager(); 
                self.draftExecution = false;
            }
        });
        $(orders).click(function(){
            if (self.openTabs != menuTab.orders) {
                self.openTabs = menuTab.orders;
                $(menuPills).find('li').removeClass('active');
                $(this).addClass('active');
                self.page = 0;      
                self.changePager(); 
                self.draftExecution = false;
            }
        });
        $(report).click(function(){
            $(menuPills).find('li').removeClass('active');
            $(this).addClass('active');
            self.openTabs = 'report';
            self.page = 0;            
            self.changePager(); 
            self.draftExecution = false;
        });
    }

    //  Изменение количества записей в листе
    recordCounter(){
        let self = this;
        $('select#count_record').change(function(sender){
            self.page = 0;
            self.lastCount = self.count;
            self.count = Number(this.value);
        });
    }

    //  Очистка записей в листе
    clearList(){
        $('div#list').children().remove();
    }

    //  Изменение указателей не следующую страницу и на предыдущую
    pagination(current, pages){
        current = Number(current);
        pages = Number(pages);
        if (current == 0)
            $('ul#pager').find('li.previous').addClass('hidden');
        else {
            $('ul#pager').find('li.previous').removeClass('hidden');
            $('ul#pager').find('li.previous').attr('page', current - 1);
        }
        if (pages == current)
            $('ul#pager').find('li.next').addClass('hidden');
        else {
            $('ul#pager').find('li.next').removeClass('hidden');
            $('ul#pager').find('li.next').attr('page', current + 1);
        }
    }

    //  Обработчик для указателя на следующую страницу
    handleNextPage(method){
        this.page++;
        method(this.page, this.count);
        return;
    }

    //  Обработчик для указателя на предыдующую страницу
    handlePrevPage(method){
        this.page--;
        method(this.page, this.count);
        return;
    }

    //  Изменение контента листа
    changePager(){
        let self = this;
        let type = self.openTabs;
        rebindPager();
        carManager.disableFilters();
        switch (type){
            case menuTab.catalog:
                carManager.enableFilters();
                bindPager(carManager.getCars);
                break;
            case menuTab.orders:
                bindPager(orderManager.getOrders);
                break;
            case 'report':
                self.getReports();
                break;
        }
        return;

        function rebindPager() {
            const mainPager = $('ul#pager');
            const prev = $(mainPager).find('li.previous')[0];
            const next = $(mainPager).find('li.next')[0];
            $(prev).unbind('click');
            $(next).unbind('click');
        }
        
        function bindPager(method) {
            const mainPager = $('ul#pager');
            const prev = $(mainPager).find('li.previous')[0];
            const next = $(mainPager).find('li.next')[0];
            $(prev).click(function(){ self.handlePrevPage(method)});
            $(next).click(function(){ self.handleNextPage(method)});
            method(self.page, self.count);
        }
    }

    //  Заполнить Draft панель
    fillDraftPanel(panel, car){
        let self = this;
        //  Обработчик даты
        let dataHandleValidator = function(input_id, msg){
            let data = ($(panel).find('input#' + input_id).val());
            if (!data){
                $(panel).find('input#'+input_id).focus();
                $(panel).find('span.dateErr').text(msg);
                return false;
            } else {
                $(panel).find('span.dateErr').text('');   
                return true;
            }
        }
        //  Закрытие панели
        $(panel).find('button.btn_close').click(function(){
            $(panel).remove();
            self.draftExecution = false;
        });
        //  Заполнение полей
        $(panel).find('h2.title').text("Оформление заказа");
        $(panel).find('span.manufacture').text(car.manufacture);
        $(panel).find('span.model').text(car.model);
        $(panel).find('span.type').text(getRuCarType(car.type));
        $(panel).find('span.cost').text(car.cost + ' руб./д.');
        $(panel).attr('carId', car.id);
        //  Поле ошибок заполнения
        const err_line = $(panel).find('span.dataErr');
        //  Заполнение начала ренты 
        const datepicker = $(panel).find('input#datepicker');
        $(datepicker).datepicker({
            minDate: new Date(),
            range: true,
            multipleDatesSeparator: " - "
        });
        $(datepicker).mask('00.00.00 - 00.00.00');
        $(datepicker).focusout(function(){
            let res = dataHandleValidator('datepicker','Неправильно задан диапозон дат');
            if (res){
                let cost = car.cost;
                let dateDif = $('input#datepicker').val().split(' - ');
                if (dateDif.length != 2) 
                    return;
                dateDif[0] = transformRuDateToISO(dateDif[0]);
                dateDif[1] = transformRuDateToISO(dateDif[1]);
                if (dateDif[0] && dateDif[1] && dateDif[0] < dateDif[1]) {
                    cost *= Math.ceil((dateDif[1] - dateDif[0])/ (24 * 60 * 60 * 1000));
                    $('form#draft_order #cost-counter').find('span').text((cost) + ' рублей');
                } else {
                    $(panel).find('span.dateErr').text('Неправильный диапозон дат');      
                }
            }
        });
        //  Отправка данных
        $(panel).find('button.btn_submit').click(function(){
            self.sendRecordToDraft(panel);
        });
    }

    //  Отправка записи 
    sendRecordToDraft(panel){
        let self = this;
        //  Определение формы
        let form = $('form#draft_order');
        //  Формирование даты
        let data = {
            carID  : self.checkID($(panel).attr('carId')),
        };
        const err_line = $(panel).find('span.dataErr');

        let date = $('#datepicker').val().split(' - ');
        if (date.length != 2) {
            $(panel).find('input#datepicker').focus();
            $(err_line).text('Неправильно задана дата аренды');
            return;
        }
        data.from = convertStringToDate(date[0]);
        data.to = convertStringToDate(date[1]);
        //  Поле ошибок заполнения
        
        //  Проверка ID автомобиля
        if (!data.carID){
            $(err_line).text('Неверный CarID');
            return;
        }
        //  Проверка даты начала ренты
        if (!data.from){
            $(panel).find('input#datepicker').focus();
            $(err_line).text('Неправильная дата начала аренды');
            return;
        }
        //  Проверка даты окончания ренты
        if (!data.to){
            $(panel).find('input#datepicker').focus();
            $(err_line).text('Неправильная дата окончания аренды');
            return;
        }
        //  Cсылка на 
        const url = '/aggregator/orders/';
        //  Отправка post запроса
        let req = new XMLHttpRequest();
        req.open('POST', url, true);
        req.setRequestHeader("Authorization", "Bearer " + self.token);
        req.setRequestHeader('Content-Type', 'application/json');
        req.onreadystatechange = function(){
            if (req.readyState != 4)
                return;
            if (req.status == 201){
                let res = JSON.parse(req.response);
                self.experidToken();                
                self.confirm_after_draft(panel, res);
            } else if (req.status == 401){
                if (self.refreshToken != null){
                    self.refresh();
                    setTimeout(function(){
                        self.sendRecordToDraft(panel);
                    }, 100);
                } else {
                    $('div#authForm').removeClass('hidden');
                    self.rendErrorTemplate(JSON.parse(req.response).message, req.status);
                }
                return;
            } else {
                self.rendErrorTemplate(JSON.parse(req.response).message, req.status);
                $(panel).remove();
            }
        };
        data = JSON.stringify(data);
        req.send(data);
    }

    //  Отправка запроса на подтверждения
    sendConfirmOrder(panel){
        let self = this;
        const id = self.checkID($(panel).attr('resID'));
        if (id){
            const url = '/aggregator/orders/confirm/' + id;
            let req = new XMLHttpRequest();
            req.open('PUT', url, true);
            req.setRequestHeader("Authorization", "Bearer " + self.token);
            req.onreadystatechange = function(){
                if (req.readyState != 4)
                    return;
                self.draftExecution = false;
                if (req.status == 200){
                    $(panel).remove();
                    self.experidToken();    
                    return;
                } else if (req.status == 401){
                    if (self.refreshToken != null){
                        self.refresh();
                        setTimeout(function(){
                            self.sendConfirmOrder(panel);
                        }, 100);
                        
                    } else {
                        $('div#authForm').removeClass('hidden');
                        self.rendErrorTemplate(JSON.parse(req.response).message, req.status);
                    }
                    return;
                } else {
                    self.rendErrorTemplate(JSON.parse(req.response).message, res.status);
                    self.draftExecution = false;
                    $(panel).remove();
                }
            }
            req.send();
        } else {
            alert('Неверный ID заказа');
        }
    }

    confirm_after_draft(panel, res){
        let self = this;
        $(panel).find('.start_date').text(new Date(res.Lease.StartDate).toLocaleDateString());
        $(panel).find('.end_date').text(new Date(res.Lease.EndDate).toLocaleDateString());
        $(panel).find('.content').remove();
        $(panel).find('.button_field').remove();
        $(panel).attr('resID', res.ID);
        $(panel).find('button.btn_confirm').click(function(){
            self.sendConfirmOrder(panel);
        });
        $(panel).find('div.hidden').removeClass('hidden');
        return;
    }

    createDraftOrder(car){
        if (!this.draftExecution){
            let panel = $(orderManager.draftTemplate).clone();
            this.fillDraftPanel(panel, car);
            this.draftExecution = true;
            $('body').append(panel);
        }
        else {
            let panel = $('div#draft_panel');
            this.fillDraftPanel(panel, car);
        }
    };

    authUser(){
        let self = this;
        let frameTemplate = $(self.iframeTemplate).clone();
        let frame = $(frameTemplate).find('iframe')[0];
        frame.sandbox.add("allow-forms");
        frame.sandbox.add("allow-pointer-lock");
        frame.sandbox.add("allow-popups");
        frame.sandbox.add("allow-same-origin");
        frame.sandbox.add("allow-scripts");
        frame.sandbox.add("allow-top-navigation");
        frame.src = 'http://localhost:3000/aggregator/auth';
        $('body').append(frameTemplate);
        frame.onload = function(){
            frame.style.display = 'none';
            let url = "";
            try{
                url = frame.contentWindow.location.origin + frame.contentWindow.location.pathname;
            } catch(err){
                frame.style.display = 'block';
            }
            const check = /http:\/\/localhost:3000\/aggregator\/code/;
            if (check.test(url)){
                let res = JSON.parse(frame.contentWindow.document.body.innerText).content;
                self.token = res.access_token;
                self.refreshToken = res.refresh_token;
                $(frameTemplate).remove();
            } else {
                frame.style.display = 'block';
            }
        }
    }

    regUser() {
        let self = this;
        let frameTemplate = $(self.iframeTemplate).clone();
        let frame = $(frameTemplate).find('iframe')[0];
        frame.sandbox.add("allow-forms");
        frame.sandbox.add("allow-pointer-lock");
        frame.sandbox.add("allow-popups");
        frame.sandbox.add("allow-same-origin");
        frame.sandbox.add("allow-scripts");
        frame.sandbox.add("allow-top-navigation");
        frame.src = 'http://localhost:3000/aggregator/registration';
        $('body').append(frameTemplate);
        frame.onload = function(){
            frame.style.display = 'none';
            let url = "";
            try{
                url = frame.contentWindow.location.origin + frame.contentWindow.location.pathname;
            } catch(err){
                frame.style.display = 'block';
            }
            const check = /http:\/\/localhost:3000\/aggregator\/code/;
            if (check.test(url)){
                let res = JSON.parse(frame.contentWindow.document.body.innerText).content;
                self.token = res.access_token;
                self.refreshToken = res.refresh_token;
                $(frame).remove();
            } else {
                frame.style.display = 'block';
            }
        }
        
    }

    authByMail() {
        let self = this;
        let frameTemplate = $(self.iframeTemplate).clone();
        let frame = $(frameTemplate).find('iframe')[0];
        frame.sandbox.add("allow-forms");
        frame.sandbox.add("allow-pointer-lock");
        frame.sandbox.add("allow-popups");
        frame.sandbox.add("allow-same-origin");
        frame.sandbox.add("allow-scripts");
        frame.sandbox.add("allow-top-navigation");
        frame.src = 'http://localhost:3000/aggregator/mailAuth';
        $('body').append(frameTemplate);
        frame.onload = function(){
            frame.style.display = 'none';
            let url = "";
            try{
                url = frame.contentWindow.location.origin + frame.contentWindow.location.pathname;
            } catch(err){
                frame.style.display = 'block';
            }
            const check = /http:\/\/localhost:3000\/aggregator\/code/;
            if (check.test(url)){
                let res = JSON.parse(frame.contentWindow.document.body.innerText).content;
                self.token = res.access_token;
                self.refreshToken = res.refresh_token;
                $(frame).remove();
            } else {
                frame.style.display = 'block';
            }
        }
        
    }

    closeFrame() {
        $('div#iframe_template').remove();
    }

    refresh(){
        let req = new XMLHttpRequest();
        let self = this;
        if (self.refreshToken != null){
            const url = '/aggregator/authByToken';
            req.open('POST', url, false);
            req.setRequestHeader("Authorization", "Bearer " + self.refreshToken);
            req.send(null);
            if (req.status != 200){
                self.rendErrorTemplate(JSON.parse(req.response).message, req.status);
                $('div#authForm').removeClass('hidden');
                self.experidToken();
                return;
            } else if (req.status == 200){
                let res = JSON.parse(req.response);
                res = res.content;
                self.token = res.access_token;
                self.refreshToken = res.refresh_token;
                return;
            }
        }        
    }

    experidToken(){
        let self = this;
        clearTimeout(self.tokenTimer);
        self.tokenTimer = setTimeout(function(){
            self.token = null;
        }, 1000000);
    }

    fillReports(content){
        let self = this;
        const list = self.getList();
        const tables = $(self.reportTemplate).clone();
        $(list).append(tables);
        let arrayInfo = [Array.from(content.authCode), Array.from(content.authToken), Array.from(content.draftOrder)];
        let names     = ['#authCodeReportTable', '#authTokenReportTable', "#draftOrderReportTable"];
        for (let I = 0; I < arrayInfo.length; I++){
            let name = names[I];
            for (let J = 0; J < arrayInfo[I].length; J++){
                let tr = document.createElement('tr');
                let td = document.createElement('td');
                td.innerText = J;
                td.classList.add('col-1');
                $(tr).append(td);
                td = document.createElement('td');
                td.classList.add('col-2');
                td.innerText = arrayInfo[I][J].id;
                $(tr).append(td);
                td = document.createElement('td');
                td.classList.add('col-3');
                td.innerText = arrayInfo[I][J].state;
                $(tr).append(td);
                td = document.createElement('td');
                td.classList.add('col-4-1');
                td.innerText = arrayInfo[I][J].message;
                $(tr).append(td);
                td = document.createElement('td');
                td.classList.add('col-4');
                td.innerText = arrayInfo[I][J].description;
                $(tr).append(td);
                $(list).find(name).append(tr);
            }
        }
    }

    getReports(){
        let self = this;
        const url = '/aggregator/reports/all';
        let req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.setRequestHeader("Authorization", "Bearer " + self.token);
        req.onreadystatechange = function(){
            if (req.readyState != 4)
                return;
            self.experidToken();  
            if (req.status == 200){
                const res = JSON.parse(req.response);
                self.clearList();
                self.fillReports(res);
                self.pagination(0, 0);
            } else if (req.status == 401){
                if (self.refreshToken){
                    self.refresh();
                    setTimeout(function(){
                        self.getReports();
                    },1000);
                } else {
                    self.rendErrorTemplate(JSON.parse(req.response).message, req.status);
                }
            } else {
                self.clearList();
                self.page = 0;
                self.rendErrorTemplateToList(JSON.parse(req.response).message, req.status);
                self.pagination(0, 0);
            }
        }
        req.send();
    }
}();

$(document).ready(function(){
    menuManager.getErrorTemplate();
    menuManager.getReportsTemplate();
    menuManager.getIFrameTemplate();
    menuManager.bindHandleToHeader();
    menuManager.recordCounter();
    menuManager.changePager();
});

function transformRuDateToISO(ruDate) {
    let temp = ruDate.split('.');
    if (temp.length != 3)
        return null;
    temp = temp[1] + '.' + temp[0] + '.' + temp[2];
    temp = new Date(Date.parse(temp));
    if (isNaN(temp))
        return null;
    return temp;
}

function convertStringToDate(date){
    date = String(date);
    if (!date)
        return null;
    const dateParts = date.split('.');
    if (!dateParts || dateParts.length != 3)
        return null;
    const year  = parseInt(dateParts[2]);
    const month = parseInt(dateParts[1]);
    const day   = parseInt(dateParts[0]);
    return day + '.' + month +'.' + year;
}