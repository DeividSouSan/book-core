// Numeric facts of the ISBN format, named so validation code reads as intent instead of arithmetic.

export const ISBN_10_LENGTH = 10;
export const ISBN_13_LENGTH = 13;

export const ISBN_10_CHECK_DIGIT_INDEX = ISBN_10_LENGTH - 1;
export const ISBN_13_CHECK_DIGIT_INDEX = ISBN_13_LENGTH - 1;

export const ISBN_10_CHECKSUM_MODULUS = 11;
export const ISBN_13_CHECKSUM_MODULUS = 10;

/** "X" represents the value 10 in the ISBN-10 check digit. */
export const ISBN_10_X_VALUE = 10;

/** ISBN-13 weights by position (1-based): odd positions weigh 1… */
export const ISBN_13_ODD_POSITION_WEIGHT = 1;
/** …and even positions weigh 3. */
export const ISBN_13_EVEN_POSITION_WEIGHT = 3;
