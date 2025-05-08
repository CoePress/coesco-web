
// ignore - oos is readonly ??
// FUNCTION DetermineStatus RETURNS CHARACTER
//   (INPUT quantity as INTEGER, INPUT minQuantity AS INTEGER, INPUT maxQuantity AS INTEGER):

//   IF minQuantity > maxQuantity THEN RETURN "Error".
//   IF quantity = 0 AND minQuantity = 0 THEN RETURN "Empty".
//   IF quantity < minQuantity AND minQuantity > 0 THEN RETURN "Below".
//   IF quantity >= minQuantity AND quantity <= maxQuantity THEN RETURN "Good".
//   IF quantity > maxQuantity THEN RETURN "Over".
//   RETURN "Unknown".
// END.