"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertType = exports.QuizType = exports.TaskStatus = exports.Difficulty = exports.Role = void 0;
var Role;
(function (Role) {
    Role["STUDENT"] = "STUDENT";
    Role["MENTOR"] = "MENTOR";
    Role["ADMIN"] = "ADMIN";
})(Role || (exports.Role = Role = {}));
var Difficulty;
(function (Difficulty) {
    Difficulty["EASY"] = "EASY";
    Difficulty["MEDIUM"] = "MEDIUM";
    Difficulty["HARD"] = "HARD";
    Difficulty["EXPERT"] = "EXPERT";
})(Difficulty || (exports.Difficulty = Difficulty = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["TODO"] = "TODO";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["DONE"] = "DONE";
    TaskStatus["ARCHIVED"] = "ARCHIVED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var QuizType;
(function (QuizType) {
    QuizType["SINGLE_CHOICE"] = "SINGLE_CHOICE";
    QuizType["MULTIPLE_CHOICE"] = "MULTIPLE_CHOICE";
    QuizType["TRUE_FALSE"] = "TRUE_FALSE";
})(QuizType || (exports.QuizType = QuizType = {}));
var AlertType;
(function (AlertType) {
    AlertType["RED_FLAG"] = "RED_FLAG";
    AlertType["YELLOW_WARNING"] = "YELLOW_WARNING";
})(AlertType || (exports.AlertType = AlertType = {}));
