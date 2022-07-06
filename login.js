$("#the_form").validate();

$(document).on('click', '#add', function (e) {
    var intId = $("#the_form div").length + 1;
    var userWrapper = $("<div class=\"form-group userwrapper\" id=\"field" + intId + "\"/>");
    var userDiv = $("<div class=\"col-lg-4\">");
    var newUserLabel = $("<label class=\" control-label\" for=\"user" + intId + "\">User:</label>");
    var newUser = $("<input type=\"text\" minlength=\"2\" what=\"users\" class=\"form-control users required\" name=\"user" + intId + "\" id=\"user" + intId + "\" /></div>");
    var passDiv = $("<div class=\"col-lg-4\">");
    var newPassLabel = $("<label class=\"control-label\" for=\"passUser" + intId + "\">Password:</label>");
    var newPass = $("<input minlength=\"6\" type=\"password\" what=\"passes\" class=\"form-control passes required\" name=\"pass" + intId + "\" id=\"passUser" + intId + "\" />");
    
    var removeButton = $("<input type=\"button\" class=\"remove btn btn-danger\" aria-hidden=\"true\" value=\"&times;\"/>");
    removeButton.click(function () {
        $(this).parent().prev().remove();
        $(this).parent().remove();
    });
    userDiv.append(newUserLabel);
    userDiv.append(newUser);
    passDiv.append(newPassLabel);
    passDiv.append(newPass);
    passDiv.append(removeButton);
    userWrapper.append(userDiv);
    userWrapper.append(passDiv);
    $("#the_form").append(userWrapper);
});