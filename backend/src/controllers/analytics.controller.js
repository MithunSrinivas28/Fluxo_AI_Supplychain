import * as analytics from "../services/analytics.service.js";

export const demandTrends = async (req, res, next) => {
  try {
    const data = await analytics.getDemandTrends(req.query.period);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const seasonal = async (req, res, next) => {
  try {
    const data = await analytics.getSeasonalAnalysis();
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const categoryDemand = async (req, res, next) => {
  try {
    const data = await analytics.getCategoryDemand();
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const zonePerformance = async (req, res, next) => {
  try {
    const data = await analytics.getZonePerformance();
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const warehouseUtilization = async (req, res, next) => {
  try {
    const data = await analytics.getWarehouseUtilization();
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const topProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await analytics.getTopProducts(limit);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const festivalImpact = async (req, res, next) => {
  try {
    const data = await analytics.getFestivalImpact();
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const forecastHistory = async (req, res, next) => {
  try {
    const data = await analytics.getForecastHistory();
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const featureImportance = async (req, res, next) => {
  try {
    const data = await analytics.getFeatureImportance();
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const mlPreview = async (req, res, next) => {
  try {
    const data = await analytics.getMLPreview(req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};
