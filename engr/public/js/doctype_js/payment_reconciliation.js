function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

frappe.ui.form.on("Payment Reconciliation", {
    onload: function(frm){
        var party_type = getUrlParameter("party_type");
        var party = getUrlParameter("party");
        console.log(party)

        if(party_type){
            setTimeout(()=>{
                cur_frm.set_value('party_type', party_type);
            },150)
        }
        if(party){
            setTimeout(()=>{
                cur_frm.set_value('party', party);
            },200)
        }
    }
})