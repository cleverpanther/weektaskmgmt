import configRepository from "../repositories/configRepository";

export default {
    migrate() {
        configCheckUpdate();
        configCalendarZoomColumnsCalendarHeight();
        addTodoDetails();
    }
}

function configCheckUpdate() {
    let config = configRepository.load();
    if (!('checkUpdates' in config)) {
        config['checkUpdates'] = true;
        configRepository.update(config);
    }
}

function configCalendarZoomColumnsCalendarHeight() {
    let config = configRepository.load();
    if (!('calendar' in config)) {
        config['calendar'] = true;
        config['zoom'] = 100;
        config['columns'] = 5;
        config['calendarHeight'] = "50%";
        configRepository.update(config);
    }
}

function addTodoDetails() {

}