var orderManager = new class order{
    constructor(){
        this.orderTemplate  = null;
        this.draftTemplate  = null;
        this.paidTemplate   = null;
        this.paidOperation  = false;
    }

    //  Получение шаблона для оформления платежа
    getPaidTemplate(){
        let self = this;
        self.paidTemplate = $('div#order_paid_template').children().clone();
        $('div#order_paid_template').remove();
        $(self.paidTemplate).removeClass('hidden-template');
        return;
    }

    //  Получение шаблона для заказа
    getOrderTemplate(){
        let self = this;
        self.orderTemplate = $('div#order_template').clone();
        $('div#order_template').remove();
        $(self.orderTemplate).removeAttr('id');
        $(self.orderTemplate).removeClass('hidden-template');
    }

    //  Получение шаблона для оформления заказа
    getDraftTemplate(){
        let self = this;
        self.draftTemplate = $('div#draft_template').children().clone();
        $('div#draft_template').remove();
        $(self.draftTemplate).removeClass('hidden-template');
        return;
    }

    //  Обработчик завершения заказа
    handleToCompleted(id, sender){
        let self = this;
        id = menuManager.checkID(id);
        if (id){
            let req = new XMLHttpRequest();
            const url = '/aggregator/orders/complete/' + id;
            req.open('PUT', url, true);
            req.setRequestHeader("Authorization", "Bearer " + menuManager.token);
            req.onreadystatechange = function(){
                if (req.readyState != 4)
                    return;
                if (req.stauts == 401){
                    if (menuManager.refreshToken != null){
                        menuManager.refresh();
                        setTimeout(function(){
                            self.handleToCompleted(id, sender);
                        }, 1000);
                    } else {
                        $('div#authForm').removeClass('hidden');
                        menuManager.rendErrorTemplate(req.response.message, req.status);
                    }
                    return;
                }
                if (req.status == 202){
                    const list = menuManager.getList();
                    menuManager.experidToken();    
                    const record = $(list).find('div').filter(function(){
                        if ($(this).attr('id') == id)
                            return true;
                    });
                    $(record).find('span.status').text('Завершено');
                    $('.action_btn.btn[oid=' + id +']').remove();
                } else {
                    menuManager.rendErrorTemplate(req.response.message, req.status);
                }
            }
            req.send();
        } else {
            alert ('НЕВЕРНЫЙ ID');
        }
        return;
    }

    //  Отправка запроса на оплату заказа
    sendPaidInfo(id, data, sender){
        const self = this;
        let req = new XMLHttpRequest();
        const url = '/aggregator/orders/paid/' + id;
        req.open('PUT', url, true);
        req.setRequestHeader('Content-type','application/json; charset=utf-8');
        req.setRequestHeader("Authorization", "Bearer " + menuManager.token);
        req.onreadystatechange = function(){
            if (req.readyState != 4)
                return;
            if (req.status == 401){
                if (menuManager.refreshToken != null){
                    menuManager.refresh();
                    setTimeout(function(){
                        self.sendPaidInfo(id, data, sender);
                    }, 1000);
                } else {
                    $('div#authForm').removeClass('hidden');
                    menuManager.rendErrorTemplate(JSON.parse(req.response).message, req.status);
                }
                return;
            }
            if (req.status == 200){
                menuManager.experidToken();    
                $(sender).text('Завершить');
                const list = menuManager.getList();
                const record = $(list).find('div').filter(function(){
                    if ($(this).attr('id') == id)
                        return true;
                });
                $(record).find('span.status').text('Оплачено');
                $(sender).unbind('click');
                $(sender).click(function(sender){
                    self.handleToCompleted(id, sender);
                });
                $('body').find('#paid_panel').remove();
                self.paidOperation = false;
            } else {
                menuManager.rendErrorTemplate(JSON.parse(req.response).message, req.status);
            }
        }
        req.send(data);
    }

    //  Обработчик на оплату заказа
    handleToPaid(id, sender, order){
        let self = this;
        id = menuManager.checkID(id);
        if (id){
            if (self.paidOperation){
                const form = $('body').find('#paid_panel');
                self.fillingPaidForm(id, form, sender, order);
                $('body').append(form);
            } else {
                self.paidOperation = true;
                const form = $(self.paidTemplate).clone();
                self.fillingPaidForm(id, form, sender, order);
                $('body').append(form);
            }
        } else {
            alert ('НЕВЕРНЫЙ ID');
        }
    }

    //  Обработчик на подтверждение заказа
    handleToConfirm(id, sender, content){
        let self = this;
        id = menuManager.checkID(id);
        if (id){
            let req = new XMLHttpRequest();
            const url = '/aggregator/orders/confirm/' + id;
            req.open('PUT', url, true);
            req.setRequestHeader("Authorization", "Bearer " + menuManager.token);
            req.onreadystatechange = function(){
                if (req.readyState != 4)
                    return;
                if (req.status == 401){
                    if (menuManager.refreshToken != null){
                        menuManager.refresh();
                        setTimeout(function(){
                            self.handleToConfirm(id, sender, content);
                        },1000);
                    } else {
                        $('div#authForm').removeClass('hidden');
                        menuManager.rendErrorTemplate(JSON.parse(req.response).message, req.status);
                    }
                    return;
                }
                if (req.status == 200){
                    menuManager.experidToken();    
                    $(sender).text('Оплатить');
                    const list = menuManager.getList();
                    const record = $(list).find('div').filter(function(){
                        if ($(this).attr('id') == id)
                            return true;
                    });
                    $(record).find('span.status').text('Ожидает оплаты');
                    $(sender).unbind('click');
                    $(sender).click(function(sender){self.handleToPaid(id, this, content);});
                } else {
                    menuManager.rendErrorTemplate(JSON.parse(req.response).message, req.status);
                }
            }
            req.send();
        } else {
            alert ('НЕВЕРНЫЙ ID');
        }
    }
    
    getOrders(page, count) {
        let self = orderManager;
        const url = '/aggregator/orders?page=' + page + '&count=' + count;
        let req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.setRequestHeader("Authorization", "Bearer " + menuManager.token);
        req.onreadystatechange = function(){
            if (req.readyState != 4)
                return;
            if (req.status == 401){
                if (menuManager.refreshToken){
                    menuManager.refresh();
                    setTimeout(function(){
                        self.getOrders(page, count);
                    },1000);
                } else {
                    $('div#authForm').removeClass('hidden');
                    menuManager.rendErrorTemplate(JSON.parse(req.response).message, req.status);
                }
                return;
            } else if (req.status == 200){
                menuManager.clearList();
                menuManager.experidToken();    
                let res = JSON.parse(req.response);
                if (res){
                    self.fillListWithOrder(res.content.orders);
                    menuManager.pagination(res.content.info.current, res.content.info.pages);
                }
            } else if (req.status == 503){
                menuManager.rendErrorTemplateToList(req.response, req.status);
                menuManager.pagination(0,0);
            } else {
                menuManager.rendErrorTemplateToList(JSON.parse(req.response).message, req.status);
                menuManager.pagination(0,0);
            }

        }
        req.send();
    }

    fillListWithOrder(list){
        let self = this;
        for (let I = 0; I < list.length; I++){
            const content = list[I];
            let record = $(self.orderTemplate).clone();
            $(record).attr('id', content.id);
            $(record).find('div.record_header').attr('orderId',content.id)
                                                    .attr('filling',false)
                                                    .attr('state','close');
            $(record).find('div.record_header').click(function(){
                if ($(this).attr('state') == 'close'){
                    if ($(this).attr('filling') == 'false'){
                        self.getOrder($(this).attr('orderId'));
                        $(this).attr('filling', true);
                    } else {
                        $(record).find('.detail_info').removeClass('hidden');
                    }
                    $(this).find('.view_detail_info').removeClass('glyphicon-chevron-down');
                    $(this).find('.view_detail_info').addClass('glyphicon-chevron-up');
                    $(this).attr('state', 'open');
                } else {
                    $(this).find('.view_detail_info').removeClass('glyphicon-chevron-up');
                    $(this).find('.view_detail_info').addClass('glyphicon-chevron-down');
                    $(record).find('.detail_info').addClass('hidden');
                    $(this).attr('state', 'close');
                }
            });
            $(record).find('h4.title').text("Заказ №" + content.id);
            $(record).find('span.lease-start').text(new Date(content.lease.from).toLocaleDateString());
            $(record).find('span.lease-end').text(new Date(content.lease.to).toLocaleDateString());
            $(record).find('span.date_issue').text(new Date(content.created).toLocaleString());
            $(record).find('span.status').text(transformToRuOrderStatus(content.status));
            $(record).find('button.action_btn').attr('oid', content.id);
            switch (content.status){
                case 'Draft':
                    $(record).find('button.action_btn').text('Подтвердить');
                    $(record).find('button.action_btn').click(function(){
                        const id = $(this).attr('oid');
                        self.handleToConfirm(id, this, content);
                    });
                    break;
                case 'Confirm':
                    $(record).find('button.action_btn').text('Оплатить');
                    $(record).find('button.action_btn').click(function(){
                        const id = $(this).attr('oid');
                        self.handleToPaid(id, this, content);
                    });
                    break;
                case 'Paid':
                    $(record).find('button.action_btn').text('Завершить');
                    $(record).find('button.action_btn').click(function(){
                        const id = $(this).attr('oid');
                        self.handleToCompleted(id, this);
                    });
                    break;
                case 'Completed':
                    $(record).find('button.action_btn').remove();
                    break;
                default:
                    break;

            }
            if (content.Car == 'Неизвестно'){
                $(record).find('.car_content').find('.col-md-12').remove();
                $(record).find('.car_content').find('h3.content_title').text("Автомобиль: " + content.Car);
            } else {
                const container = $(record).find('.car_content');
                $(container).find('.manufacture').text(content.Car.manufacture);
                $(container).find('.model').text(content.Car.model);
                $(container).find('.type').text(getRuCarType(content.Car.type));
                $(container).find('.cost').text(content.Car.cost + " руб./д.");
                $(container).find('.door').text(content.Car.doors);
                $(container).find('.person').text(content.Car.person);
                $(container).find('.transmission').text(getRuTransmissonType(content.Car.transmission));
            }
            if (content.billing && content.billing != undefined) {
                const container = $(record).find('.billing_content');
                $(container).find('.billingId').text(content.billing.id);
                $(container).find('.paySystem').text(content.billing.paySystem);
                $(container).find('.account').text(content.billing.account);
                $(container).find('.cost').text(content.billing.cost);
            } else {
                $(record).find('.billing_content').remove();
            }
            $(menuManager.getList()).append(record);
        }
    }

    //  Заполнение платежной формы
    fillingPaidForm(id, form, sender, order){
        let self = this;
        $(form).find('button.btn_submit').attr('id', id);
        $(form).find('.btn_close').click(function(){$(form).remove(); self.paidOperation = false});
        $(form).find('#paySystem').change(function(){
            const value = menuManager.checkPaySystem(this.value);
            if (!value)
                $(form).find('span.errStatus').text('Некорректная платежная система');
            else {
                $(form).find('span.errStatus').text('');    
            }
        });
        $(form).find('#account').focusout(function(){
            if (!menuManager.checkAccount(this.value)){
                $(form).find('span.errStatus').text('Неправильно введен счет');
            } else {
                $(form).find('span.errStatus').text('');
            }
        });
        $(form).find('#account').mask('0000 0000 0000 0000 00');
        $(form).find('#owner').mask('ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ', {
            translation:  {'Z': {pattern: /[A-Z]|\s/, optional: true}}
        });
        $(form).find('#cost').text(order.cost);
        $(form).find('button.btn.btn_submit').click(function(){
            const data = {
                paySystem   : menuManager.checkPaySystem($(form).find('option').filter(':selected').val()),
                account     : menuManager.checkAccount($(form).find('#account').val()),
            }
            if (!data.paySystem){
                $(form).find('#paySystem').focus();
                $(form).find('.errStatus').text('Некорректная платежная система');
                return;
            }
            if (!data.account){
                $(form).find('#account').focus();
                $(form).find('.errStatus').text('Неправильно введен счет');
                return;
            }
            self.sendPaidInfo(id, JSON.stringify(data), sender);
        });
    }
}();

$(document).ready(function() {
    orderManager.getOrderTemplate();
    orderManager.getDraftTemplate();
    orderManager.getPaidTemplate();
});

function transformToRuOrderStatus(status) {
    switch(status.toLowerCase()) {
        case 'draft': 
            return 'Черновик'
            break;
        case 'confirm':
        case 'waitforbilling':
            return 'Ожидает оплаты';
            break;
        case 'paid':
            return 'Оплачено';
            break;
        case 'completed':
            return 'Завершен';
            break;
    }
}