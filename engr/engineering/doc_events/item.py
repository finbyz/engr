import frappe

def validate(self,method):
	create_item_price(self)

def on_update(self,method):
	create_item_price(self)

def create_item_price(self):
	if self.buying_price:
		buying_price_list = frappe.db.get_single_value('Buying Settings', 'buying_price_list')
		if frappe.db.exists("Item Price",{"item_code":self.item_code,"price_list": buying_price_list}):
			name = frappe.db.get_value("Item Price",{"item_code":self.item_code,"price_list": buying_price_list},'name')
			frappe.db.set_value("Item Price",name,"price_list_rate",self.buying_price)
		else:
			item_price = frappe.new_doc("Item Price")
			item_price.price_list = buying_price_list
			item_price.buying = 1
			item_price.item_code = self.item_code
			item_price.price_list_rate= self.buying_price
				
			item_price.save()
			
	if self.selling_price:
		selling_price_list = frappe.db.get_single_value('Selling Settings', 'selling_price_list')
		if frappe.db.exists("Item Price",{"item_code":self.item_code,"price_list": selling_price_list}):
			name = frappe.db.get_value("Item Price",{"item_code":self.item_code,"price_list": selling_price_list},'name')
			frappe.db.set_value("Item Price",name,"price_list_rate",self.selling_price)
		else:
			item_price = frappe.new_doc("Item Price")
			item_price.price_list = selling_price_list
			item_price.selling = 1
			item_price.item_code = self.item_code
			item_price.price_list_rate= self.selling_price
				
			item_price.save()