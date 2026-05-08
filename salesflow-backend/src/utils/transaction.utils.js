const mongoose = require('mongoose');

/**
 * Runs a set of database operations in an ACID Transaction if replica sets are supported.
 * If transactions are not supported by the current MongoDB deployment, it falls back to running
 * the operations normally without a transaction session.
 * 
 * @param {Function} operationsFn - A function that receives the Mongoose session: (session) => Promise<any>
 * @returns {Promise<any>} The result of the operationsFn
 */
const runInTransaction = async (operationsFn) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await operationsFn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    // If transactions are not supported (e.g. standalone local MongoDB), fallback gracefully
    const isNoReplSet = error.message && (
      error.message.includes('Transaction numbers are only allowed') ||
      error.message.includes('replica set') ||
      error.code === 20 || // IllegalOperation
      error.code === 251   // NoMatchingTransaction
    );

    if (isNoReplSet) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Ignore errors during abort if the session is already inactive
      }
      session.endSession();
      // Execute the operations again without a session
      return await operationsFn(null);
    }

    // Otherwise, it's a real validation or application error, so rollback and throw
    try {
      await session.abortTransaction();
    } catch (abortErr) {
      // Ignore errors during abort
    }
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  runInTransaction
};
