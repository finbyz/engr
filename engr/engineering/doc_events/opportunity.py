import frappe

def validate(self, method):
    update_title(self)

def update_title(self):
    if self.name not in self.title:
        self.title = str(self.title) + ": " + str(self.name)