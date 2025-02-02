const {successResponse, errorResponse} = require('../../baseAPI.controller');
const PlanService = require('../../../../services/plan.service');
const getPlans = async (req, res) => {
    try {
        const plans = await PlanService.getPlansSV();
        successResponse(res, plans, 'Plans fetched successfully');
    } catch (error) {
        errorResponse(res, error.message || 'Internal server error');
    }
}

const getPlan = async (req, res) => {
    try {
        const globalId = req.params.id;
        const plan = await PlanService.getPlanSV(globalId);
        successResponse(res, plan, 'Plan fetched successfully');
    } catch (error) {
        errorResponse(res, error.message || 'Internal server error');
    }
}
module.exports = {
    getPlans, 
    getPlan,
};