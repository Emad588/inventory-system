const { AuditLog } = require('../models');

const logAction = async (action, entity, entityId, details, userId, ipAddress) => {
  try {
    await AuditLog.create({
      action,
      entity,
      entityId: String(entityId),
      details,
      userId,
      ipAddress,
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

module.exports = { logAction };
