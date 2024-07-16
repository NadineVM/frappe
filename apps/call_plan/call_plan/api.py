import frappe


def get_query_condition_for_plan(user):
    call_role=frappe.db.get_value('User',user,'pic_role')
    if call_role=='PR':
        pr_code=frappe.db.get_value('User',user,'pic_code')
        return f"kode_pic='{pr_code}'"