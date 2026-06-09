if _G.OmniBubbleGui then 
    pcall(function() _G.OmniBubbleGui:Destroy() end)
end
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

-- Target UI Parent Fallback for Executor Stability
local UIParent = game:GetService("CoreGui")
local successGui, _ = pcall(function() local test = game:GetService("CoreGui").Name end)
if not successGui then
    UIParent = LocalPlayer:WaitForChild("PlayerGui")
end

-- 1. BASE STORAGE & BACKUPS
local imageLinks = {
    ["avatar1"] = "https://cdn.discordapp.com/attachments/1381580466942902335/1513561592086794310/4h4f-ujB_400x400.png?ex=6a282d94&is=6a26dc14&hm=69be6d2d3c9605c6c3202fa360cf2c62fe70090bb9c695cb3099b811c0a9d369&",
    ["avatar2"] = "https://cdn.discordapp.com/attachments/1381580466942902335/1513561591772217426/hatsune_miku_vocaloid_and_1_more_drawn_by_nazunobasho__sample-325cdc3da184b3fe001ef697e7294cb0.png?ex=6a282d94&is=6a26dc14&hm=097d93a223a421255db15f25718e48850b0abb1bc6b11343b18c77e940373aae&",
    ["avatar3"] = "https://cdn.discordapp.com/attachments/1381580466942902335/1513561591298129951/sample_a570f31072aee4e32fd27eec66691ccd92d3c177.png?ex=6a282d93&is=6a26dc13&hm=ca4592366c78fcdfbc5790b09a04b2b1932ae8f681ff98b48abd530acfa2f23e&",
    ["avatar4"] = "https://cdn.discordapp.com/attachments/1381580466942902335/1513648205483741214/15c307c0515123e656030c04494a5d27.gif?ex=6a287e3e&is=6a272cbe&hm=2ee05409f244bda8e6ea0c059b9d0f1b318efc37758508531a5639edbfbcdfc1&",
    ["avatar5"] = "https://cdn.discordapp.com/attachments/1381580466942902335/1513648204804133134/images.jpg?ex=6a287e3e&is=6a272cbe&hm=fee48516f46987c809cc5b35b39e74dd1f30393f8faf78f55085d3fdfa2b2a92&"
}
local assets = {}
local originalSkybox = {
    Ambient = Lighting.Ambient,
    OutdoorAmbient = Lighting.OutdoorAmbient,
    FogEnd = Lighting.FogEnd,
    ClockTime = Lighting.ClockTime,
    ColorShift_Top = Lighting.ColorShift_Top
}
local shiftLockConn = nil
local isShiftLockEnabled = false
local currentShiftLockAsset = ""
local selectedAssetForWrapping = ""
local dropdownStates = {}

local rigPartMapping = {
    ["Head"] = {"Head"},
    ["Torso"] = {"Torso", "UpperTorso", "LowerTorso"},
    ["Arms"] = {"Left Arm", "Right Arm", "LeftUpperArm", "LeftLowerArm", "LeftHand", "RightUpperArm", "RightLowerArm", "RightHand"},
    ["Legs"] = {"Left Leg", "Right Leg", "LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "RightUpperLeg", "RightLowerLeg", "RightFoot"}
}

local function backupSkybox()
    local sky = Lighting:FindFirstChildOfClass("Sky")
    if sky and not originalSkybox.Saved then
        originalSkybox.SkyboxBk = sky.SkyboxBk
        originalSkybox.SkyboxDn = sky.SkyboxDn
        originalSkybox.SkyboxFt = sky.SkyboxFt
        originalSkybox.SkyboxLf = sky.SkyboxLf
        originalSkybox.SkyboxRt = sky.SkyboxRt
        originalSkybox.SkyboxUp = sky.SkyboxUp
        originalSkybox.Saved = true
    end
end
backupSkybox()

local function downloadAsset(name, url)
    local cacheName = name:gsub(" ", "") .. "_v5.png"
    local success, content = pcall(function() return game:HttpGet(url) end)
    if success and content and #content > 1000 then
        pcall(function() writefile(cacheName, content) end)
        local assetSuccess, assetResult = pcall(function() return getcustomasset(cacheName) end)
        if assetSuccess then assets[name] = assetResult else assets[name] = url end
    else
        assets[name] = url
    end
end

for name, url in pairs(imageLinks) do 
    task.spawn(downloadAsset, name, url) 
end

-- 2. UI INITIALIZATION
local ScreenGui = Instance.new("ScreenGui", UIParent)
ScreenGui.Name = "OmniBubbleGui"
ScreenGui.ResetOnSpawn = false
_G.OmniBubbleGui = ScreenGui

local ShiftLockCursor = Instance.new("ImageLabel", ScreenGui)
ShiftLockCursor.Size = UDim2.new(0, 32, 0, 32)
ShiftLockCursor.AnchorPoint = Vector2.new(0.5, 0.5)
ShiftLockCursor.Position = UDim2.new(0.5, 0, 0.5, 0)
ShiftLockCursor.BackgroundTransparency = 1
ShiftLockCursor.Visible = false

local MainBubble = Instance.new("Frame", ScreenGui)
MainBubble.Size = UDim2.new(0, 65, 0, 65)
MainBubble.Position = UDim2.new(0.05, 0, 0.35, 0)
MainBubble.BackgroundColor3 = Color3.fromRGB(15, 15, 20)
MainBubble.BackgroundTransparency = 0.1
MainBubble.Active = true
MainBubble.ClipsDescendants = true

local BubbleCorner = Instance.new("UICorner", MainBubble)
BubbleCorner.CornerRadius = UDim.new(1, 0)

local UIStroke = Instance.new("UIStroke", MainBubble)
UIStroke.Color = Color3.fromRGB(0, 180, 216)
UIStroke.Thickness = 2.5

local ToggleButton = Instance.new("ImageButton", MainBubble)
ToggleButton.Size = UDim2.new(0, 65, 0, 65)
ToggleButton.BackgroundTransparency = 1
ToggleButton.Image = imageLinks["avatar1"]
Instance.new("UICorner", ToggleButton).CornerRadius = UDim.new(1, 0)

local ContainerFrame = Instance.new("Frame", MainBubble)
ContainerFrame.Size = UDim2.new(0, 190, 0, 280)
ContainerFrame.Position = UDim2.new(0, 80, 0, 10)
ContainerFrame.BackgroundTransparency = 1
ContainerFrame.Visible = false

local ActionListFrame = Instance.new("ScrollingFrame", ContainerFrame)
ActionListFrame.Size = UDim2.new(1, 0, 1, 0)
ActionListFrame.BackgroundTransparency = 1
ActionListFrame.ScrollBarThickness = 2
ActionListFrame.CanvasSize = UDim2.new(0, 0, 0, 0)

local UIList = Instance.new("UIListLayout", ActionListFrame)
UIList.Padding = UDim.new(0, 6)
UIList.SortOrder = Enum.SortOrder.LayoutOrder
UIList:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
    ActionListFrame.CanvasSize = UDim2.new(0, 0, 0, UIList.AbsoluteContentSize.Y + 15)
end)

-- Dragging Engine
local dragging, dragInput, dragStart, startPos
local isFrozen = false
ToggleButton.InputBegan:Connect(function(input)
    if (input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch) then
        dragging = true
        dragStart = input.Position
        startPos = MainBubble.Position
        input.Changed:Connect(function()
            if input.UserInputState == Enum.UserInputState.End then dragging = false end
        end)
    end
end)

ToggleButton.InputChanged:Connect(function(input)
    if (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then dragInput = input end
end)

UserInputService.InputChanged:Connect(function(input)
    if input == dragInput and dragging and not isFrozen then
        local delta = input.Position - dragStart
        MainBubble.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
    end
end)

local buildActionList

-- 3. ENVIRONMENT & TEXTURE CONTROLS
local function clearTargetedDecals(tag)
    for _, obj in ipairs(workspace:GetDescendants()) do
        if obj:IsA("Decal") and obj.Name == tag then obj:Destroy() end
    end
    if tag == "OmniParticles" then
        for _, obj in ipairs(workspace:GetDescendants()) do
            if obj:IsA("ParticleEmitter") and obj.Name == "OmniAmbientFog" then obj:Destroy() end
        end
    end
end

local function setSkybox(assetId)
    local sky = Lighting:FindFirstChildOfClass("Sky") or Instance.new("Sky", Lighting)
    sky.SkyboxBk = assetId; sky.SkyboxDn = assetId; sky.SkyboxFt = assetId
    sky.SkyboxLf = assetId; sky.SkyboxRt = assetId; sky.SkyboxUp = assetId
end

local function applyEnvironmentTrick(mode, assetId)
    if mode == "Fullbright" then
        Lighting.Ambient = Color3.fromRGB(255, 255, 255)
        Lighting.OutdoorAmbient = Color3.fromRGB(255, 255, 255)
        Lighting.FogEnd = 999999
    elseif mode == "NeonCyber" then
        Lighting.Ambient = Color3.fromRGB(40, 0, 80)
        Lighting.OutdoorAmbient = Color3.fromRGB(10, 0, 30)
        Lighting.ClockTime = 0
    elseif mode == "AssetTint" and assetId then
        Lighting.Ambient = Color3.fromRGB(240, 150, 180)
        Lighting.ColorShift_Top = Color3.fromRGB(255, 180, 200)
        Lighting.ClockTime = 16.5
    elseif mode == "Spooky" then
        Lighting.Ambient = Color3.fromRGB(5, 15, 10)
        Lighting.OutdoorAmbient = Color3.fromRGB(0, 5, 5)
        Lighting.FogEnd = 150
    elseif mode == "ParticleStorm" and assetId then
        clearTargetedDecals("OmniParticles")
        local root = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
        if root then
            local attachment = Instance.new("Attachment", root)
            attachment.Name = "OmniParticleAttachment"
            local emitter = Instance.new("ParticleEmitter", attachment)
            emitter.Name = "OmniAmbientFog"
            emitter.Texture = assetId
            emitter.Rate = 25
            emitter.Lifetime = NumberRange.new(3, 5)
            emitter.Speed = NumberRange.new(5, 12)
            emitter.VelocitySpread = 360
            emitter.Size = NumberSequence.new(2, 4)
        end
    elseif mode == "Reset" then
        Lighting.Ambient = originalSkybox.Ambient
        Lighting.OutdoorAmbient = originalSkybox.OutdoorAmbient
        Lighting.FogEnd = originalSkybox.FogEnd
        Lighting.ClockTime = originalSkybox.ClockTime
        Lighting.ColorShift_Top = originalSkybox.ColorShift_Top
        if LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart") then
            for _, child in ipairs(LocalPlayer.Character.HumanoidRootPart:GetChildren()) do
                if child.Name == "OmniParticleAttachment" then child:Destroy() end
            end
        end
    end
end

local function textureSpecificBodyParts(partCategory, assetId)
    if assetId == "" or not LocalPlayer.Character then return end    
    local targets = rigPartMapping[partCategory]
    if not targets then return end    
    for _, partName in ipairs(targets) do
        local p = LocalPlayer.Character:FindFirstChild(partName)
        if p and p:IsA("BasePart") and p.Name ~= "HumanoidRootPart" then
            for _, child in ipairs(p:GetChildren()) do
                if child:IsA("Decal") and child.Name == "CustomFaceDecal" then child:Destroy() end
            end
            for _, face in ipairs(Enum.NormalId:GetEnumItems()) do
                local d = Instance.new("Decal", p)
                d.Name = "CustomFaceDecal"
                d.Face = face
                d.Texture = assetId
            end
        end
    end
end

local function textureEntireMap(assetId)
    clearTargetedDecals("MapFaceDecal")
    for _, obj in ipairs(workspace:GetDescendants()) do
        if obj:IsA("BasePart") and not obj:IsDescendantOf(Players) and not obj.Parent:FindFirstChildOfClass("Humanoid") then
            for _, face in ipairs(Enum.NormalId:GetEnumItems()) do
                local d = Instance.new("Decal", obj)
                d.Name = "MapFaceDecal"
                d.Face = face
                d.Texture = assetId
            end
        end
    end
end

-- 4. TOTAL SYSTEM OVERRIDE SHIFTLOCK ENGINE
local function updateShiftLockState()
    local char = LocalPlayer.Character
    local hum = char and char:FindFirstChildOfClass("Humanoid")
    local camera = workspace.CurrentCamera
    
    if isShiftLockEnabled and hum and char:FindFirstChild("HumanoidRootPart") then
        ShiftLockCursor.Image = currentShiftLockAsset
        ShiftLockCursor.Visible = true
        hum.CameraOffset = Vector3.new(1.7, 0.5, 0)
        hum.AutoRotate = false
        
        if not shiftLockConn then
            shiftLockConn = RunService:BindToRenderStep("OmniShiftLockOverride", Enum.RenderPriority.Camera.Value + 1, function()
                UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter
                local char = LocalPlayer.Character
                local root = char and char:FindFirstChild("HumanoidRootPart")
                if root and camera then
                    local camLook = camera.CFrame.LookVector
                    root.CFrame = CFrame.new(root.Position, root.Position + Vector3.new(camLook.X, 0, camLook.Z))
                end
            end)
        end
    else
        pcall(function() RunService:UnbindFromRenderStep("OmniShiftLockOverride") end)
        shiftLockConn = nil
        UserInputService.MouseBehavior = Enum.MouseBehavior.Default
        ShiftLockCursor.Visible = false
        if hum then
            hum.CameraOffset = Vector3.new(0, 0, 0)
            hum.AutoRotate = true
        end
    end
end

local function toggleShiftLock(assetId)
    currentShiftLockAsset = assetId
    isShiftLockEnabled = not isShiftLockEnabled
    updateShiftLockState()
end

local function addTextureToolToInventory(name, assetId)
    local tool = Instance.new("Tool")
    tool.Name = name .. " Painter"
    tool.RequiresHandle = true
    
    local handle = Instance.new("Part")
    handle.Name = "Handle"
    handle.Size = Vector3.new(1.2, 1.2, 1.2)
    handle.Material = Enum.Material.Neon
    handle.Parent = tool
    
    for _, face in ipairs(Enum.NormalId:GetEnumItems()) do
        local d = Instance.new("Decal", handle)
        d.Face = face
        d.Texture = assetId
    end
    
    tool.Activated:Connect(function()
        local mouse = LocalPlayer:GetMouse()
        if mouse and mouse.Target and mouse.Target:IsA("BasePart") then
            local targetPart = mouse.Target
            if not targetPart:IsDescendantOf(LocalPlayer.Character) then
                for _, child in ipairs(targetPart:GetChildren()) do
                    if child:IsA("Decal") and child.Name == "ToolPaintedDecal" then child:Destroy() end
                end
                for _, face in ipairs(Enum.NormalId:GetEnumItems()) do
                    local d = Instance.new("Decal", targetPart)
                    d.Name = "ToolPaintedDecal"
                    d.Face = face
                    d.Texture = assetId
                end
            end
        end
    end)
    
    local backpack = LocalPlayer:FindFirstChildOfClass("Backpack")
    if backpack then tool.Parent = backpack end
end

local function revertAllToOriginal()
    clearTargetedDecals("CustomFaceDecal")
    clearTargetedDecals("MapFaceDecal")
    clearTargetedDecals("ToolPaintedDecal")
    clearTargetedDecals("OmniParticles")
    applyEnvironmentTrick("Reset")
    isShiftLockEnabled = false
    updateShiftLockState()
    local sky = Lighting:FindFirstChildOfClass("Sky")
    if sky and originalSkybox.Saved then
        sky.SkyboxBk = originalSkybox.SkyboxBk; sky.SkyboxDn = originalSkybox.SkyboxDn; sky.SkyboxFt = originalSkybox.SkyboxFt
        sky.SkyboxLf = originalSkybox.SkyboxLf; sky.SkyboxRt = originalSkybox.SkyboxRt; sky.SkyboxUp = originalSkybox.SkyboxUp
    end
    if buildActionList then buildActionList() end
end

-- 5. UI CORE LAYOUT ENGINE
local function createDropdown(title, order)
    local dropdownFrame = Instance.new("Frame", ActionListFrame)
    dropdownFrame.Name = title .. "_Dropdown"
    dropdownFrame.Size = UDim2.new(1, -6, 0, 30)
    dropdownFrame.BackgroundTransparency = 1
    dropdownFrame.ClipsDescendants = true
    dropdownFrame.LayoutOrder = order
    
    local headerButton = Instance.new("TextButton", dropdownFrame)
    headerButton.Size = UDim2.new(1, 0, 0, 30)
    headerButton.BackgroundColor3 = Color3.fromRGB(30, 30, 35)
    headerButton.Font = Enum.Font.SourceSansBold
    headerButton.Text = (dropdownStates[title] and "➖ " or "➕ ") .. title
    headerButton.TextColor3 = Color3.fromRGB(255, 255, 255)
    headerButton.TextSize = 14
    Instance.new("UICorner", headerButton).CornerRadius = UDim.new(0, 5)
    
    local itemContainer = Instance.new("Frame", dropdownFrame)
    itemContainer.Position = UDim2.new(0, 0, 0, 35)
    itemContainer.Size = UDim2.new(1, 0, 0, 0)
    itemContainer.BackgroundTransparency = 1
    
    local containerLayout = Instance.new("UIListLayout", itemContainer)
    containerLayout.Padding = UDim.new(0, 4)
    
    if dropdownStates[title] then
        task.defer(function()
            dropdownFrame.Size = UDim2.new(1, -6, 0, containerLayout.AbsoluteContentSize.Y + 40)
        end)
    end
    
    containerLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
        if dropdownStates[title] then
            dropdownFrame.Size = UDim2.new(1, -6, 0, containerLayout.AbsoluteContentSize.Y + 40)
        end
    end)
    
    headerButton.MouseButton1Click:Connect(function()
        dropdownStates[title] = not dropdownStates[title]
        headerButton.Text = (dropdownStates[title] and "➖ " or "➕ ") .. title
        local targetHeight = dropdownStates[title] and (containerLayout.AbsoluteContentSize.Y + 40) or 30
        TweenService:Create(dropdownFrame, TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
            Size = UDim2.new(1, -6, 0, targetHeight)
        }):Play()
    end)
    
    return itemContainer
end

local function createButton(parent, text, color, onClick)
    local btn = Instance.new("TextButton", parent)
    btn.Size = UDim2.new(1, 0, 0, 28)
    btn.BackgroundColor3 = color
    btn.Font = Enum.Font.SourceSansBold
    btn.TextColor3 = Color3.new(1, 1, 1)
    btn.TextSize = 12
    btn.Text = text
    Instance.new("UICorner", btn).CornerRadius = UDim.new(0, 4)
    btn.MouseButton1Click:Connect(onClick)
    return btn
end

buildActionList = function()
    for _, item in ipairs(ActionListFrame:GetChildren()) do
        if not item:IsA("UIListLayout") then item:Destroy() end
    end
    
    local selectImgCategory = createDropdown("1. Select Inventory Image", 1)
    local bodyPartsCategory = createDropdown("2. Wrap Selected Body Part", 2)
    local giveItemCategory = createDropdown("3. Give Asset Tool", 3)
    local mapCategory = createDropdown("Texture Entire Map", 4)
    local skyCategory = createDropdown("Skyboxes", 5)
    local worldFxCategory = createDropdown("World FX & Tricks Panel", 6)
    local shiftlockCategory = createDropdown("Custom Shiftlock", 7)
    local utilsCategory = createDropdown("Utilities & Configs", 8)
    
    local sortedKeys = {}
    for name in pairs(imageLinks) do table.insert(sortedKeys, name) end
    table.sort(sortedKeys)
    
    for _, name in ipairs(sortedKeys) do
        local asset = assets[name] or imageLinks[name]
        local displayColor = (selectedAssetForWrapping == asset) and Color3.fromRGB(0, 200, 100) or Color3.fromRGB(114, 9, 183)
        createButton(selectImgCategory, name .. ((selectedAssetForWrapping == asset) and " [SELECTED]" or ""), displayColor, function()
            selectedAssetForWrapping = asset
            buildActionList() 
         end)
    end
    
    for partName, _ in pairs(rigPartMapping) do
        createButton(bodyPartsCategory, "Wrap: " .. partName, Color3.fromRGB(94, 60, 230), function()
            if selectedAssetForWrapping ~= "" then textureSpecificBodyParts(partName, selectedAssetForWrapping) end
        end)
    end
    
    for _, name in ipairs(sortedKeys) do
        local asset = assets[name] or imageLinks[name]
        createButton(giveItemCategory, "Give: " .. name .. " Painter Tool", Color3.fromRGB(244, 162, 97), function()
            addTextureToolToInventory(name, asset)
        end)
    end
    
    -- STEROID ENVIRONMENT FX INJECTION
    createButton(worldFxCategory, "☀️ Fullbright Room / Clear Fog", Color3.fromRGB(255, 210, 0), function() applyEnvironmentTrick("Fullbright") end)
    createButton(worldFxCategory, "🌆 Cyberpunk Midnight", Color3.fromRGB(130, 0, 200), function() applyEnvironmentTrick("NeonCyber") end)
    createButton(worldFxCategory, "🧟 Horror Fog Mode", Color3.fromRGB(40, 60, 50), function() applyEnvironmentTrick("Spooky") end)
    createButton(worldFxCategory, "❌ Reset World Lighting", Color3.fromRGB(80, 90, 100), function() applyEnvironmentTrick("Reset") end)
    
    for _, name in ipairs(sortedKeys) do
        local asset = assets[name] or imageLinks[name]
        createButton(mapCategory, name, Color3.fromRGB(43, 147, 72), function() textureEntireMap(asset) end)
        createButton(skyCategory, name, Color3.fromRGB(0, 119, 182), function() setSkybox(asset) end)
        createButton(shiftlockCategory, "Lock Cursor: " .. name, Color3.fromRGB(224, 122, 95), function() toggleShiftLock(asset) end)
        
        -- Asset Specific Visual FX Manipulation
        createButton(worldFxCategory, "✨ " .. name .. " Ambient Tint", Color3.fromRGB(255, 140, 170), function() applyEnvironmentTrick("AssetTint", asset) end)
        createButton(worldFxCategory, "🌪️ " .. name .. " Floating Particles", Color3.fromRGB(0, 180, 216), function() applyEnvironmentTrick("ParticleStorm", asset) end)
    end
    
    createButton(utilsCategory, "🔄 REVERT EVERYTHING", Color3.fromRGB(230, 57, 70), revertAllToOriginal)
    createButton(utilsCategory, isFrozen and "🔓 Unlock Dragging" or "🔒 Freeze Dragging", Color3.fromRGB(74, 78, 105), function()
        isFrozen = not isFrozen
        buildActionList()
    end)
end

-- Toggle Setup
local isExpanded = false
ToggleButton.MouseButton1Click:Connect(function()
    isExpanded = not isExpanded
    local targetSize = isExpanded and UDim2.new(0, 280, 0, 300) or UDim2.new(0, 65, 0, 65)
    local targetCorner = isExpanded and UDim.new(0, 12) or UDim.new(1, 0)
    if isExpanded then buildActionList() end
    TweenService:Create(MainBubble, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {Size = targetSize}):Play()
    TweenService:Create(BubbleCorner, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {CornerRadius = targetCorner}):Play()
    task.wait(0.1)
    ContainerFrame.Visible = isExpanded
end)