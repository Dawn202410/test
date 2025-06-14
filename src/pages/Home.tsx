import { Link } from "react-router-dom";
import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRepairData } from "@/hooks/useRepairData";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface RoleCardProps {
  title: string;
  icon: string;
  description: string;
  to: string;
  color: string;
  gradient: string;
}

function RoleCard({ title, icon, description, to, color, gradient }: RoleCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Link
        to={to}
        className={cn(
          "block p-8 rounded-xl shadow-lg transition-all duration-300 transform hover:shadow-xl",
          color,
          gradient
        )}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-white/20">
            <i className={`${icon} text-2xl text-white`}></i>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-white/80">{description}</p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Home() {
  const { stats, loading, error } = useRepairData();
  
  const todayStats = {
    today: stats[0]?.value || 0,
    completed: stats[1]?.value || 0,
    processing: stats[2]?.value || 0,
    pending: stats[3]?.value || 0
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <i className="fa-solid fa-house-chimney text-2xl"></i>
              <h1 className="text-2xl font-bold">物业报修管理系统</h1>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#" className="hover:text-blue-100 transition-colors font-medium">首页</a>
              <a href="#" className="hover:text-blue-100 transition-colors font-medium">关于</a>
              <a href="#" className="hover:text-blue-100 transition-colors font-medium">帮助</a>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            欢迎使用物业报修系统
          </h2>
          <p className="text-xl text-gray-600 font-medium">
            快速报修、高效处理、智能管理，为您提供便捷的物业服务体验
          </p>
        </motion.div>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            {loading ? (
              <div className="text-3xl font-bold text-blue-600 mb-2">
                <i className="fa-solid fa-spinner fa-spin"></i>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-blue-600 mb-2">{todayStats.today}</div>
                <div className="text-gray-500">今日报修</div>
              </>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            {loading ? (
              <div className="text-3xl font-bold text-green-600 mb-2">
                <i className="fa-solid fa-spinner fa-spin"></i>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-green-600 mb-2">{todayStats.completed}</div>
                <div className="text-gray-500">已处理</div>
              </>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            {loading ? (
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                <i className="fa-solid fa-spinner fa-spin"></i>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-yellow-600 mb-2">{todayStats.processing}</div>
                <div className="text-gray-500">处理中</div>
              </>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            {loading ? (
              <div className="text-3xl font-bold text-red-600 mb-2">
                <i className="fa-solid fa-spinner fa-spin"></i>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-red-600 mb-2">{todayStats.pending}</div>
                <div className="text-gray-500">待处理</div>
              </>
            )}
          </div>
        </div>


        {/* 角色入口按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-12">
          <RoleCard 
            title="报修登记" 
            icon="fa-solid fa-file-pen" 
            description="提交维修申请，跟踪处理进度"
            to="/report"
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            gradient="hover:from-blue-600 hover:to-blue-700 hover:shadow-lg"
          />
          <RoleCard 
            title="维修处理" 
            icon="fa-solid fa-screwdriver-wrench" 
            description="查看和处理维修工单"
            to="/process"
            color="bg-gradient-to-br from-green-500 to-green-600"
            gradient="hover:from-green-600 hover:to-green-700 hover:shadow-lg"
          />
          <RoleCard 
            title="备件库" 
            icon="fa-solid fa-boxes-stacked" 
            description="管理维修备件和库存"
            to="/spare-parts"
            color="bg-gradient-to-br from-orange-500 to-orange-600"
            gradient="hover:from-orange-600 hover:to-orange-700 hover:shadow-lg"
          />
          <RoleCard 
            title="服务标准" 
            icon="fa-solid fa-tags" 
            description="管理服务项目和收费标准"
            to="/service-price"
            color="bg-gradient-to-br from-cyan-500 to-cyan-600"
            gradient="hover:from-cyan-600 hover:to-cyan-700 hover:shadow-lg"
          />
          <RoleCard 
            title="客户档案" 
            icon="fa-solid fa-users" 
            description="管理客户信息和历史记录"
            to="/customer-profile"
            color="bg-gradient-to-br from-pink-500 to-pink-600"
            gradient="hover:from-pink-600 hover:to-pink-700 hover:shadow-lg"
          />
          <RoleCard 
            title="财务管理" 
            icon="fa-solid fa-coins" 
            description="查看收费统计和支付状态"
            to="/finance-management"
            color="bg-gradient-to-br from-teal-500 to-teal-600"
            gradient="hover:from-teal-600 hover:to-teal-700 hover:shadow-lg"
          />
          <RoleCard 
            title="管理后台" 
            icon="fa-solid fa-chart-line" 
            description="查看系统数据和分析报表"
            to="/admin"
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            gradient="hover:from-purple-600 hover:to-purple-700 hover:shadow-lg"
          />
        </div>
      </main>

      {/* 底部 */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">© 2025 版权所有 亨达（天津）建筑工程有限公司</p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="hover:text-blue-300 transition-colors text-sm">隐私政策</a>
              <a href="#" className="hover:text-blue-300 transition-colors text-sm">服务条款</a>
              <a 
                href="mailto:contact@hengda-construction.com" 
                className="hover:text-blue-300 transition-colors text-sm"
                onClick={(e) => {
                  e.preventDefault();
                  alert('联系人：Dawn\n联系电话：18002061367');
                }}
              >
                联系我们
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}