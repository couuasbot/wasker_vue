import os
import subprocess

def call_copilot_model(prompt):
    """通过 gh models 接口调用 GitHub Pro 额度的模型"""
    # 我们使用 gpt-4o 作为编码大脑
    cmd = ["gh", "models", "run", "gpt-4o"]
    try:
        process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate(input=prompt)
        return stdout
    except Exception as e:
        return f"Error: {str(e)}"

def vibe_coding_task():
    print("--- 启动 Copilot 额度 Vibe Coding ---")
    
    # 场景：优化 Galaxy 动画或背景性能
    # 假设我们要优化 src/components/Galaxy.vue (如果不存在则新建一个演示)
    target_file = "src/components/Galaxy.vue"
    
    prompt = f"""
    You are a creative frontend engineer. I want to optimize a 'Galaxy' background component for a Vue 3 + Vite project.
    The goal is to use Three.js or Canvas API to create a performant, beautiful starfield.
    Requirement:
    1. Use Vue 3 <script setup> syntax.
    2. Optimize for GPU (requestAnimationFrame, BufferGeometry).
    3. Ensure it's responsive.
    
    Please provide the full code for {target_file}.
    """
    
    print(f"正在向 GitHub Copilot (GPT-4o) 发送编码请求...")
    code = call_copilot_model(prompt)
    
    if code and "<template>" in code:
        os.makedirs(os.path.dirname(target_file), exist_ok=True)
        with open(target_file, "w") as f:
            f.write(code)
        print(f"✅ 优化后的代码已由 Copilot 生成并写入 {target_file}")
    else:
        print("❌ 模型返回结果不符合预期，请检查 gh models 授权。")
        print(f"DEBUG: {code}")

if __name__ == "__main__":
    vibe_coding_task()
