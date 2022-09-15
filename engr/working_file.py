
#graphicarb pending QTy patch
# update `tabSales Order Item`
# set pending_delivered_qty = qty -delivered_qty
# where pending_delivered_qty != qty -delivered_qty

# select name,qty,delivered_qty,pending_delivered_qty
# from `tabSales Order Item`
# where pending_delivered_qty != qty -delivered_qty