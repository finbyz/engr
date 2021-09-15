import datetime,frappe

def validate(self,method):
    get_salary_slip_period(self)

def get_salary_slip_period(self):
    if self.start_date:
        frappe.msgprint(int(self.start_date.split('-')[2]), int(self.start_date.split('-')[0]), int(self.start_date.split('-')[1]))
        start_month = datetime.datetime(int(self.start_date.split('-')[2]), int(self.start_date.split('-')[0]), int(self.start_date.split('-')[1])).strftime("%b")
        if self.end_date:
            end_month =datetime.datetime(int(self.end_date.split('-')[2]), int(self.end_date.split('-')[0]), int(self.end_date.split('-')[1])).strftime("%b")
            if start_month == end_month:
                self.salary_slip_period = start_month

