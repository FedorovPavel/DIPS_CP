var carManager = new class car{
    constructor(refToMenu){
        this.template = null;
    }

    getCarTemplate(){
        let self = this;
        self.template = $('div#car_template').clone();
        $('div#car_template').remove();
        $(self.template).removeClass('hidden');
        $(self.template).removeAttr('id');
        return;
    }

    fillListWithCar(list){
        let self = this;
        for (let I = 0; I < list.length; I++){
            const content = list[I];
            let record = $(self.template).clone();
            $(record).attr('id', content.id);
            $(record).find('div.record_header').attr('carId',content.id)
                                                    .attr('filling',false)
                                                    .attr('state','close');
            $(record).find('div.record_header').click(function(){
                if ($(this).attr('state') == 'close'){
                    if ($(this).attr('filling') == 'false'){
                        self.getCar($(this).attr('carId'), this);
                        $(this).attr('filling', true);
                    } else {
                        $(record).find('.detail_info').removeClass('hidden-detail');
                    }
                    $(this).find('.view_detail_info').removeClass('glyphicon-chevron-down');
                    $(this).find('.view_detail_info').addClass('glyphicon-chevron-up');
                    $(this).attr('state', 'open');
                } else {
                    $(this).find('.view_detail_info').removeClass('glyphicon-chevron-up');
                    $(this).find('.view_detail_info').addClass('glyphicon-chevron-down');
                    $(record).find('.detail_info').addClass('hidden-detail');
                    $(this).attr('state', 'close');
                }
            });
            $(record).find('h4.title').text(content.manufacture + ' ' + content.model);
            $(record).find('span.manufacture').text(content.manufacture);
            $(record).find('span.model').text(content.model);
            $(record).find('span.type').text(getRuCarType(content.type));
            $(record).find('span.cost').text(content.cost + ' руб./д.');
            $(record).find('button.create_order').attr('carId', content.id);
            $(record).find('button.create_order').click(function(sender){
                let carId = $(this).attr('carId');
                menuManager.createDraftOrder(content);
            });
            $(menuManager.getList()).append(record);
        }
    }
    
    getCars(page, count) {
        let self = carManager;
        const url = '/aggregator/catalog?page=' + page + '&count=' + count;
        $.get(url)
            .done(function(res){
                menuManager.clearList();
                self.fillListWithCar(res.content.cars);
                menuManager.pagination(res.content.info.current, res.content.info.pages);
            })
            .fail(function(res){
                menuManager.clearList();
                menuManager.page = 0;
                menuManager.rendErrorTemplateToList(res.responseText, res.status);
                menuManager.pagination(0,0);
            });
    }
    
    updateCarInfo(record, info){
        const detail = $(record).find('.detail_info');
        $(detail).find('span.door').text(info.doors);
        $(detail).find('span.person').text(info.person);
        $(detail).find('span.transmission').text(getRuTransmissonType(info.transmission));
        $(detail).removeClass('hidden-detail');
    }
    
    getCar(id, sender) {
        let self = this;
        const url = '/aggregator/catalog/' + id;
        $.get(url, function(res){
            const record = $('div#list').find('div').filter(function(index){
                if (id == $(this).attr('id'))
                    return true;
            });
            self.updateCarInfo(record, res);
        })
        .fail(function(res){
            menuManager.rendErrorTemplate(res.responseText, res.status);
            $(sender).attr('filling','false');
        });
    }
}();

$(document).ready(function() {
    carManager.getCarTemplate();
});

function getRuCarType(type) {
    switch(type) {
        case 'sedan':
            return 'Седан';
        case 'hatchback':
            return 'Хечбек'
        case 'SUV':
            return 'Внедорожник';
        case 'wagon':
            return 'Универсал';
        case 'van':
            return 'Фургон';
        case 'coupe':
            return 'Купе';
        case 'minivan':
            return 'Минивен';
        case 'other':
        default: 
            return 'Другое';
    }
}

function getRuTransmissonType(type) {
    switch (type){
        case 'auto':
            return 'Автоматическая';
        case 'manual':
            return 'Механическая';
        case 'robot':
            return 'Роботизированная';
        default:
            return '';
    }
}