$().ready(function() {
    $('a.goto-link').click(function(e) {
        var $orig = $(this).attr('href');
        var $goto = $orig.substr($orig.indexOf('#') + 1);
        
        var $pos = 0;
        if ($goto && $goto.length != 0) {
            $obj = $('a[name="' + $goto + '"]');
            
            if ($obj && $obj.length == 1) {
                $pos = $obj.offset().top - 50;
            }
        }
        
        $('html, body').animate({ scrollTop: $pos });
        
        e.stopPropagation();
        return false;
    });
});

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return 'pt-BR';
}

function registerNewsletter() {
    var emailAddress = $('#email').val();
    if (!emailAddress || emailAddress.length === 0) {
        alert('Type your email address!');
        return;
    }
    
    var regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    var match = emailAddress.match(regex);
    
    if (!match) {
        alert('Please type a valid email address!');
        return;
    }
    
    var csrf = $('#_csrf').val();
    
    $.ajax({
        type: "POST",
        url: '/api/register-newsletter',
        data: { _csrf: csrf, emailAddress: match[0] },
        success: function() {
            alert('You should receive a confirmation email in a few moments to validate your email adress!\n\nThank you!');
        }
    });
}