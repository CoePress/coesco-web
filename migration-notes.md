OptLink.ID -> StdEquip.ID
OptLink.DescID -> StdOptDesc.DescID
StdOptDesc.DescID -> StdOption.DescID
StdOptDesc.OptionGrpID -> OptionOrder.OrderID

StdOption - Options for BOM


EquipOpt.ID -> 
EquipOpt.Model -> EquipList.Model (master equipment specs - this is migrating to our items table with type = equipment)