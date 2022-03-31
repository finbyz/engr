import frappe

@frappe.whitelist()
def get_tech_specs(item_code = None ):
    if(item_code):
        data = frappe.get_doc("Item", item_code)
        if data.specifications:
            message = ''
            for row in data.specifications:
                message = message + table_content(row)
            final_message = header() + message + """</tbody></table></div>"""

            return final_message

def header():
    message = """
    <style>
            .tbspace>tbody>tr>td {
        padding: 0 2px 0 2px !important;
        margin: 0 !important;
        border-spacing: 0 !important;
        }
    </style>
    <div>
        <table border="1" cellspacing="0" cellpadding="0" width="100%" class="tbspace">
            <tbody>
                """
    return message

def table_content(row):
    if row.separate:
        message = """</tbody></table></div>
        <div>
            <p align="center" style="font-size:11px;"><b><u> {0} </u></b></p>

                <table border="1" cellspacing="0" cellpadding="0" width="100%" class="tbspace">
            <tbody>""".format(row.specification)
        return message
    elif row.bold:
        message = """<tr align="left">
                <td width="35%"><b> {0} </b></td>
                <td valign="top"><b> {1} </b></td>
            </tr>""".format(row.specification, row.value)
        return message
    else:
        message = """<tr align="left">
                <td width="35%"> {0} </td>
                <td valign="top"> {1} </td>
            </tr>""".format(row.specification, row.value)
        return message