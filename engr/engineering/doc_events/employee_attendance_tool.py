import frappe
import json
import datetime
from frappe.utils import getdate


@frappe.whitelist()
def mark_employee_attendance(
	employee_list: list | str,
	status: str,
	date: str | datetime.date,
	leave_type: str = None,
	company: str = None,
	late_entry: str = None,
	early_exit: str = None,
	shift: str = None,
	employee_is_on_site: str = "1",
) -> None:
	if isinstance(employee_list, str):
		employee_list = json.loads(employee_list)

	for employee in employee_list:
		leave_type = None
		if status == "On Leave" and leave_type:
			leave_type = leave_type
		frappe.db.delete("Attendance" , {"employee":employee,"attendance_date":date , "status":status})
		attendance = frappe.get_doc(
			dict(
				doctype="Attendance",
				employee=employee,
				attendance_date=getdate(date),
				status=status,
				leave_type=leave_type,
				late_entry=late_entry,
				early_exit=early_exit,
				shift=shift,
				employee_is_on_site = employee_is_on_site
			)
		)
		attendance.insert()
		attendance.submit()