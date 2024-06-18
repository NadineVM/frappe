# Copyright (c) 2024, Frappe Technologies and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class imagetestingparent(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from call_plan.call_plan.doctype.image_testing.image_testing import imagetesting
		from frappe.types import DF

		table_lcbr: DF.Table[imagetesting]
	# end: auto-generated types

	pass
